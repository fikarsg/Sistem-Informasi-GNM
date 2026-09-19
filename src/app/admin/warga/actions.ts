'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ResidentStatus } from '@/lib/types/database';

interface VerifyResult {
  userId: string;
  fullName: string;
}

async function verifyPengurus(): Promise<VerifyResult> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Sesi login telah berakhir. Silakan login kembali.');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status, full_name')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'PENGURUS' || profile?.status !== 'AKTIF') {
    throw new Error('Akses ditolak: Hanya Pengurus aktif yang berhak mengelola akun warga.');
  }

  return {
    userId: user.id,
    fullName: profile.full_name || 'Pengurus',
  };
}

export interface CreateResidentPayload {
  fullName: string;
  houseId?: string | null;
  phone?: string | null;
  email?: string | null;
  residentStatus: ResidentStatus;
  isPrimary: boolean;
  createAccount?: boolean;
  password?: string | null;
}

export async function createResidentAction(payload: CreateResidentPayload) {
  const admin = await verifyPengurus();
  const adminSupabase = createAdminClient();

  const fullName = payload.fullName.trim();
  const email = payload.email?.trim().toLowerCase() || null;
  const phone = payload.phone?.trim() || null;
  const houseId = payload.houseId || null;

  if (!fullName) {
    return { success: false, error: 'Nama lengkap wajib diisi.' };
  }

  if (payload.createAccount) {
    if (!email) {
      return { success: false, error: 'Email wajib diisi untuk pembuatan akun login.' };
    }
    if (!payload.password || payload.password.length < 6) {
      return { success: false, error: 'Password minimal 6 karakter.' };
    }

    // 1. Cek apakah email sudah terdaftar di auth
    const { data: existingUser } = await adminSupabase.auth.admin.listUsers();
    const isEmailTaken = existingUser?.users?.some((u) => u.email?.toLowerCase() === email);
    if (isEmailTaken) {
      return { success: false, error: `Email ${email} sudah terdaftar di sistem. Gunakan email lain.` };
    }

    // 2. Buat user auth via Admin API
    const { data: authData, error: createAuthError } = await adminSupabase.auth.admin.createUser({
      email,
      password: payload.password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone,
        role: 'WARGA',
      },
    });

    if (createAuthError || !authData.user) {
      return { success: false, error: createAuthError?.message || 'Gagal membuat akun login warga.' };
    }

    const newUserId = authData.user.id;

    // 3. Pastikan profiles tersinkron dengan role WARGA
    await adminSupabase.from('profiles').upsert({
      id: newUserId,
      full_name: fullName,
      phone,
      email,
      role: 'WARGA',
      status: 'AKTIF',
      updated_at: new Date().toISOString(),
    });

    // 4. Tambahkan data resident
    const { data: resident, error: residentError } = await adminSupabase
      .from('residents')
      .insert({
        user_id: newUserId,
        house_id: houseId,
        full_name: fullName,
        phone,
        email,
        resident_status: payload.residentStatus,
        is_primary: payload.isPrimary,
      })
      .select('*, house:houses(*)')
      .single();

    if (residentError) {
      // Rollback user if resident insert fails
      await adminSupabase.auth.admin.deleteUser(newUserId);
      return { success: false, error: residentError.message };
    }

    // 5. Catat audit log
    await adminSupabase.from('audit_logs').insert({
      user_id: admin.userId,
      role: 'PENGURUS',
      action: 'BUAT_AKUN_WARGA',
      module: 'WARGA',
      record_id: resident.id,
      new_data: {
        resident_id: resident.id,
        user_id: newUserId,
        email,
        full_name: fullName,
        house_id: houseId,
      },
    });

    return {
      success: true,
      data: resident,
      credentials: {
        email,
        password: payload.password,
      },
    };
  } else {
    // Hanya simpan data resident biasa tanpa akun login
    const { data: resident, error: residentError } = await adminSupabase
      .from('residents')
      .insert({
        house_id: houseId,
        full_name: fullName,
        phone,
        email,
        resident_status: payload.residentStatus,
        is_primary: payload.isPrimary,
      })
      .select('*, house:houses(*)')
      .single();

    if (residentError) {
      return { success: false, error: residentError.message };
    }

    return { success: true, data: resident };
  }
}

export async function createAccountForExistingResidentAction(params: {
  residentId: string;
  email: string;
  password: string;
}) {
  const admin = await verifyPengurus();
  const adminSupabase = createAdminClient();

  const email = params.email.trim().toLowerCase();
  if (!email) return { success: false, error: 'Email wajib diisi.' };
  if (!params.password || params.password.length < 6) {
    return { success: false, error: 'Password minimal 6 karakter.' };
  }

  // 1. Ambil data resident
  const { data: resident, error: residentErr } = await adminSupabase
    .from('residents')
    .select('*')
    .eq('id', params.residentId)
    .single();

  if (residentErr || !resident) {
    return { success: false, error: 'Data warga tidak ditemukan.' };
  }

  if (resident.user_id) {
    return { success: false, error: 'Warga ini sudah memiliki akun login aktif.' };
  }

  // 2. Buat akun Auth
  const { data: authData, error: createAuthError } = await adminSupabase.auth.admin.createUser({
    email,
    password: params.password,
    email_confirm: true,
    user_metadata: {
      full_name: resident.full_name,
      phone: resident.phone,
      role: 'WARGA',
    },
  });

  if (createAuthError || !authData.user) {
    return { success: false, error: createAuthError?.message || 'Gagal membuat akun login warga.' };
  }

  const newUserId = authData.user.id;

  // 3. Update profiles
  await adminSupabase.from('profiles').upsert({
    id: newUserId,
    full_name: resident.full_name,
    phone: resident.phone,
    email,
    role: 'WARGA',
    status: 'AKTIF',
    updated_at: new Date().toISOString(),
  });

  // 4. Link resident dengan user_id
  const { data: updatedResident, error: updateErr } = await adminSupabase
    .from('residents')
    .update({
      user_id: newUserId,
      email,
      updated_at: new Date().toISOString(),
    })
    .eq('id', resident.id)
    .select('*, house:houses(*)')
    .single();

  if (updateErr) {
    return { success: false, error: updateErr.message };
  }

  // 5. Audit log
  await adminSupabase.from('audit_logs').insert({
    user_id: admin.userId,
    role: 'PENGURUS',
    action: 'LINK_AKUN_WARGA',
    module: 'WARGA',
    record_id: resident.id,
    new_data: {
      resident_id: resident.id,
      user_id: newUserId,
      email,
    },
  });

  return {
    success: true,
    data: updatedResident,
    credentials: {
      email,
      password: params.password,
    },
  };
}

export async function resetResidentPasswordAction(params: {
  userId: string;
  newPassword: string;
  residentName: string;
}) {
  const admin = await verifyPengurus();
  const adminSupabase = createAdminClient();

  if (!params.newPassword || params.newPassword.length < 6) {
    return { success: false, error: 'Password baru minimal 6 karakter.' };
  }

  const { error } = await adminSupabase.auth.admin.updateUserById(params.userId, {
    password: params.newPassword,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // Audit log
  await adminSupabase.from('audit_logs').insert({
    user_id: admin.userId,
    role: 'PENGURUS',
    action: 'RESET_PASSWORD_WARGA',
    module: 'WARGA',
    record_id: params.userId,
    new_data: {
      target_user_id: params.userId,
      resident_name: params.residentName,
    },
  });

  return { success: true };
}

export async function deleteResidentWithAccountAction(residentId: string) {
  const admin = await verifyPengurus();
  const adminSupabase = createAdminClient();

  // Ambil user_id jika ada
  const { data: resident } = await adminSupabase
    .from('residents')
    .select('user_id, full_name')
    .eq('id', residentId)
    .single();

  // Hapus resident
  const { error: delErr } = await adminSupabase.from('residents').delete().eq('id', residentId);
  if (delErr) return { success: false, error: delErr.message };

  // Jika punya user_id auth, hapus juga akun auth-nya
  if (resident?.user_id) {
    await adminSupabase.auth.admin.deleteUser(resident.user_id);
    await adminSupabase.from('profiles').delete().eq('id', resident.user_id);
  }

  // Audit log
  await adminSupabase.from('audit_logs').insert({
    user_id: admin.userId,
    role: 'PENGURUS',
    action: 'HAPUS_WARGA',
    module: 'WARGA',
    record_id: residentId,
    old_data: resident,
  });

  return { success: true };
}

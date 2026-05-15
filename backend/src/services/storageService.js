const fs = require('fs');
const path = require('path');
const env = require('../config/env');

const uploadsRoot = path.join(process.cwd(), 'uploads');
const allowedImageMimes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const extensionByMime = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
};

function assertValidImage(file) {
  if (!file) {
    const error = new Error('Imagen requerida.');
    error.status = 400;
    throw error;
  }
  if (!allowedImageMimes.has(file.mimetype)) {
    const error = new Error('Formato de imagen no permitido. Use JPG, PNG o WEBP.');
    error.status = 400;
    throw error;
  }
}

function safeFileName(itemId, file) {
  const extension = extensionByMime[file.mimetype] || path.extname(file.originalname).toLowerCase();
  return `${itemId}-${Date.now()}${extension}`;
}

function requireSupabaseConfig() {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey || !env.supabaseBucket) {
    const error = new Error('Faltan variables de Supabase Storage para subir imagenes.');
    error.status = 500;
    throw error;
  }
}

function getPublicObjectUrl(objectPath) {
  const baseUrl = env.supabaseUrl.replace(/\/$/, '');
  return `${baseUrl}/storage/v1/object/public/${encodeURIComponent(env.supabaseBucket)}/${objectPath
    .split('/')
    .map(encodeURIComponent)
    .join('/')}`;
}

function getSupabaseObjectPath(imagePath) {
  if (!imagePath || !env.supabaseUrl) return '';
  const marker = `/storage/v1/object/public/${env.supabaseBucket}/`;
  const index = imagePath.indexOf(marker);
  if (index === -1) return '';
  return decodeURIComponent(imagePath.slice(index + marker.length));
}

async function uploadLocalImage(kind, itemId, file) {
  const uploadRoot = path.join(uploadsRoot, kind);
  fs.mkdirSync(uploadRoot, { recursive: true });
  const fileName = safeFileName(itemId, file);
  const targetPath = path.join(uploadRoot, fileName);

  if (file.buffer) {
    await fs.promises.writeFile(targetPath, file.buffer);
  } else if (file.path) {
    await fs.promises.rename(file.path, targetPath);
  } else {
    const error = new Error('No se pudo procesar la imagen.');
    error.status = 400;
    throw error;
  }

  return `/uploads/${kind}/${fileName}`;
}

async function uploadSupabaseImage(kind, itemId, file) {
  requireSupabaseConfig();
  const objectPath = `${kind}/${safeFileName(itemId, file)}`;
  const uploadUrl = `${env.supabaseUrl.replace(/\/$/, '')}/storage/v1/object/${encodeURIComponent(env.supabaseBucket)}/${objectPath
    .split('/')
    .map(encodeURIComponent)
    .join('/')}`;

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.supabaseServiceRoleKey}`,
      apikey: env.supabaseServiceRoleKey,
      'Content-Type': file.mimetype,
      'Cache-Control': '31536000',
      'x-upsert': 'false'
    },
    body: file.buffer
  });

  if (!response.ok) {
    const message = await response.text().catch(() => '');
    const error = new Error(`No se pudo subir la imagen a Supabase Storage. ${message}`.trim());
    error.status = 502;
    throw error;
  }

  return getPublicObjectUrl(objectPath);
}

async function uploadAssetImage(kind, itemId, file) {
  assertValidImage(file);
  if (env.storageDriver === 'supabase') {
    return uploadSupabaseImage(kind, itemId, file);
  }
  return uploadLocalImage(kind, itemId, file);
}

async function uploadEquipmentImage(equipmentId, file) {
  return uploadAssetImage('equipment', equipmentId, file);
}

async function uploadStockImage(stockId, file) {
  return uploadAssetImage('stock', stockId, file);
}

async function deleteEquipmentImage(imagePath) {
  if (!imagePath) return;

  if (imagePath.startsWith('/uploads/')) {
    const oldPath = path.join(process.cwd(), imagePath.replace(/^\//, ''));
    await fs.promises.unlink(oldPath).catch(() => {});
    return;
  }

  if (env.storageDriver !== 'supabase') return;
  const objectPath = getSupabaseObjectPath(imagePath);
  if (!objectPath) return;
  requireSupabaseConfig();

  const deleteUrl = `${env.supabaseUrl.replace(/\/$/, '')}/storage/v1/object/${encodeURIComponent(env.supabaseBucket)}`;
  await fetch(deleteUrl, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${env.supabaseServiceRoleKey}`,
      apikey: env.supabaseServiceRoleKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ prefixes: [objectPath] })
  }).catch(() => {});
}

module.exports = {
  allowedImageMimes,
  deleteEquipmentImage,
  deleteStockImage: deleteEquipmentImage,
  uploadEquipmentImage,
  uploadStockImage
};

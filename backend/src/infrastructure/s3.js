/**
 * S3 Infrastructure
 *
 * Moved from src/s3.js to src/infrastructure/s3.js.
 * Provides S3 upload / download / presigned URL helpers.
 * Logic is unchanged — only the file location changes.
 */

const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')

const s3 = new S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
})

const BUCKET = process.env.S3_BUCKET

/**
 * Generate a pre-signed URL for PUT upload (expires in 15 min).
 */
async function generateUploadUrl(key, contentType) {
    const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        ContentType: contentType,
    })
    return getSignedUrl(s3, command, { expiresIn: 900 })
}

/**
 * Upload a file buffer directly to S3.
 * Returns the public URL (or key if private bucket).
 */
async function uploadFile(buffer, key, contentType) {
    const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
    })
    await s3.send(command)
    return `https://${BUCKET}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${key}`
}

/**
 * Download a file from S3 and return it as a Buffer.
 */
async function getFile(key) {
    const command = new GetObjectCommand({ Bucket: BUCKET, Key: key })
    const response = await s3.send(command)
    const chunks = []
    for await (const chunk of response.Body) {
        chunks.push(chunk)
    }
    return Buffer.concat(chunks)
}

module.exports = { generateUploadUrl, uploadFile, getFile }

import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || 
    // Fallback for local development - replace with your actual service account
    '{"type":"service_account","project_id":"crypto-6cdc8","private_key_id":"274fd141812f3bac193d5c80c94a55fe369ea863","private_key":"-----BEGIN PRIVATE KEY-----\\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCU86CVyMXodVp2\\n3RG6IOOt+3chvCXiTKJUelbfS//gy+geRnmz+8b11Ab4EyQq9Mw9W8oW8hoX5vqv\\nQp1jQ3vzpdD66+6WD2vjG4ip/klUoBCLyBsf0sYaDMs0fX+CzF1U636vz+/m5/D+\\n6rp0wHQOAE+filUxo153F80yYwa6+t8af4h6O32lLztxmxRFpvZUlF+Vai0q/xU5\\npeaPugnSuO7Exx2qw54JPK6x+K+DxJ5vqpVimSxwI8wFQ51cTqKKJjS3Gbd4CODE\\n7T5NcbIvAyte2lhqdYdX4IaXOFScfqyXy5qBCKl5EL2yxAELb5/bJri931nf6aoc\\nDKy1Sz4TAgMBAAECggEAH60DvHa656l1OIvgxjVSVeCBQDJT2CE18EMoEEqIOtUC\\nItYX8ZecgxC4/q6LZXszp+TKQEDyHZ0oOHcxIzfptzHPFF1yGoVjCyQC1yvVimKT\\nwjYm1oirSkToPdxmbnlpa7K8+UR+Hxu6G2vthQCcbZHRXPs9DNZSM39jStDWUJLQ\\nKN0Z2f5/WVmMuh01CIcx33Yp1fmhDK4b1XgHZz/r90jyllrIeMsPIEmyXLD7UNlo\\nYeF0S5LDY6Io4CnM+tdrTWXciAvSA4vh+K9Vm00O5WTTpJMa+TTRk2vk/bciueYR\\nXj7xTkz8gh+aev9dvp5AUShEKyo++qzFnSgmtXMg2QKBgQDGSbnuSRilHstEZa7R\\n6plarYBEwWH8byQQx2TjQab8zQL7UZpiSKutTwjbFpKW4lBR2msW3VdoGqnUOWMM\\naNLo4pyqpwJKTsI9WxHaY7ADuW3mN6GimoBgluNFz2u6WhkGS0C1PZhGoJYNQ1Tk\\ntrTrYdGJzJY5sytmbcB67YM39wKBgQDATeR3ZobM2HGhMvBCw7+p5PqyJPRaIWSa\\n+517TOlG+IFmwtAtSxF1MZTtoLzZkz4EMB1hhDDCLXERfOF7ZKlxAsnPwRB2tL+2\\nj7CyY7XZP9LunMiie6tCaYdgKSrqgpkrATVJ755nA2K+fpKHlY0nERTepX15D495\\njnzo6577xQKBgAv+UZy0FyWFo03TyKsxwWzWqbd+6upV3pyVMuj8A5mu3MtOuEPR\\nmXC2Ixb9Woh9z9XjnC6Z3LuTQUpw3ijV/kvPySIZT+4mrWEArSfEd9UB1j/ihYhM\\nSA+PkNecICv5XyIeUx+jRh6ff/P1aqEa2/6QwBfRpBSBXdKoOMg2rYUpAoGAAvLu\\n1vnmhUuoam1qi8uOq99MDOFOMfejIFFNd++VADadXWMNaDRnfyGUhBRb8QY2BEBs\\nousxCDlEK517o7XGd2owiBQQ2ZEqA3Wuov2uczdsV6Zl2UAGP014+vuGofQAv00U\\ncR7QkgnWQM+WFagwcvHrHQLyqqGXdKi/t56tYHUCgYBB2ZrWlujeF0l751P77Lym\\nulJAeXIsxn9UrZnX0sNG4zcE1gM97k5EarVcfaJ5Ia4qByPxKfiMOarPtmGGmMqd\\ndrtbwvEVBWgOUqL4QEcKzwRIjSrpm1EOjfe/MUL6ObjKRXtIvMbhHiK1FT7jNefz\\nZdrJIq9wRB9DN4wjYKQi5Q==\\n-----END PRIVATE KEY-----\\n","client_email":"firebase-adminsdk-fbsvc@crypto-6cdc8.iam.gserviceaccount.com","client_id":"105741322369604777129","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40crypto-6cdc8.iam.gserviceaccount.com","universe_domain":"googleapis.com"}';
  
  if (!serviceAccountKey) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. Please check your .env file.');
  }
  
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountKey);
  } catch (error) {
    throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY format. Please ensure it contains valid JSON.');
  }
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: `${serviceAccount.project_id}.appspot.com`
  });
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();

export default admin;
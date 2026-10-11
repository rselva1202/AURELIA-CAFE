import admin from 'firebase-admin'

let initialized = false

export function getFirebaseAdmin() {
  const firebaseAdmin = admin?.default || admin

  if (initialized && Array.isArray(firebaseAdmin?.apps) && firebaseAdmin.apps.length > 0) {
    return {
      admin: firebaseAdmin,
      db: typeof firebaseAdmin.firestore === 'function' ? firebaseAdmin.firestore() : null,
    }
  }

  try {
    let serviceAccount = null

    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
    } else if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID || 'aurelia-cafe-demo',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }
    }

    const apps = Array.isArray(firebaseAdmin?.apps) ? firebaseAdmin.apps : []

    if (serviceAccount && apps.length === 0 && typeof firebaseAdmin?.initializeApp === 'function') {
      firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert(serviceAccount),
      })
      initialized = true
    } else if (apps.length === 0 && typeof firebaseAdmin?.initializeApp === 'function') {
      firebaseAdmin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'aurelia-cafe-demo',
      })
      initialized = true
    }
  } catch (err) {
    console.warn('[FirebaseAdmin] Notice: Running in mock/demo fallback mode without live service account:', err.message)
  }

  const apps = Array.isArray(firebaseAdmin?.apps) ? firebaseAdmin.apps : []
  let dbInstance = null

  if (apps.length > 0 && typeof firebaseAdmin?.firestore === 'function') {
    try {
      dbInstance = firebaseAdmin.firestore()
    } catch {
      dbInstance = null
    }
  }

  return {
    admin: firebaseAdmin,
    db: dbInstance,
  }
}

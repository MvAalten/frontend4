import { useState } from "react"
import {
    signInWithEmailAndPassword,
    signInWithPopup,
    createUserWithEmailAndPassword
} from "firebase/auth"
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore"
import { initializeApp } from "firebase/app"

// Firebase config (you can move this to a separate file later)
const firebaseConfig = {
    apiKey: "AIzaSyDIab5pd5vj0hSCa1AisTB1Cy1t2t-Ngbk",
    authDomain: "l2p4frontend.firebaseapp.com",
    projectId: "l2p4frontend",
    storageBucket: "l2p4frontend.appspot.com",
    messagingSenderId: "439165311953",
    appId: "1:439165311953:web:3d5465838296978009def0",
    measurementId: "G-MH08GCCV0P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

const Login = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [username, setUsername] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [isRegister, setIsRegister] = useState(false)

    const createUserDocument = async (user, additionalData = {}) => {
        const userRef = doc(db, 'users', user.uid)
        const userSnap = await getDoc(userRef)

        if (!userSnap.exists()) {
            const { displayName, email } = user
            const userData = {
                username: additionalData.username || displayName || email.split('@')[0],
                email: email,
                password: additionalData.password || "google_auth",
                role: "user" // Default role assignment
            }

            try {
                await setDoc(userRef, userData)
                console.log("User document created successfully with default role")
            } catch (error) {
                console.error("Error creating user document:", error)
            }
        }
    }

    const handleEmailAuth = async (e) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            let userCredential;

            if (isRegister) {
                if (!username) {
                    setError("Username is required for registration")
                    setLoading(false)
                    return
                }
                userCredential = await createUserWithEmailAndPassword(auth, email, password)
                await createUserDocument(userCredential.user, {
                    username,
                    password
                })
                alert("Account created successfully!")
            } else {
                userCredential = await signInWithEmailAndPassword(auth, email, password)
                await createUserDocument(userCredential.user, {
                    password
                })
                alert("Logged in successfully!")
            }

            if (onLoginSuccess) onLoginSuccess()

        } catch (err) {
            setError(
                err.code === "auth/invalid-credential"
                    ? "Ongeldige inloggegevens. Controleer je e-mail en wachtwoord."
                    : err.code === "auth/email-already-in-use"
                        ? "Dit e-mailadres is al in gebruik."
                        : err.message,
            )
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleSignIn = async () => {
        setError("")
        setLoading(true)

        try {
            const result = await signInWithPopup(auth, googleProvider)
            const user = result.user

            await createUserDocument(user)
            alert("Google login successful!")
            if (onLoginSuccess) onLoginSuccess()

        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-md mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-6 text-center text-black">
                    {isRegister ? "Registreren" : "Inloggen"}
                </h2>

                <div className="mb-6">
                    <button
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 disabled:opacity-50"
                    >
                        {loading ? "Bezig..." : "Inloggen met Google"}
                    </button>
                </div>

                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">of</span>
                    </div>
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-4">
                    {isRegister && (
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                                Gebruikersnaam
                            </label>
                            <input
                                id="username"
                                type="text"
                                placeholder="Voer je gebruikersnaam in"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required={isRegister}
                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                            />
                        </div>
                    )}

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            E-mail
                        </label>
                        <input
                            id="email"
                            type="email"
                            placeholder="Voer je e-mail in"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                            Wachtwoord
                        </label>
                        <input
                            id="password"
                            type="password"
                            placeholder="Voer je wachtwoord in"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                        />
                    </div>

                    {!isRegister && (
                        <div className="text-right">
                            <button type="button" className="text-blue-600 hover:underline text-sm">
                                Wachtwoord vergeten?
                            </button>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? "Bezig..." : (isRegister ? "Registreren" : "Inloggen")}
                    </button>
                </form>

                {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}

                <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600">
                        {isRegister ? "Heb je al een account?" : "Nog geen account?"}{" "}
                        <button
                            type="button"
                            onClick={() => setIsRegister(!isRegister)}
                            className="text-blue-600 hover:underline"
                        >
                            {isRegister ? "Inloggen" : "Registreren"}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
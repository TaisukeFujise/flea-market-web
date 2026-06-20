import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, getAdditionalUserInfo } from 'firebase/auth'
import { auth } from '../../firebase'
import { registerUser } from '../../utils/auth'
import styles from './SignupPage.module.css'

type FormValues = { email: string; password: string; username: string }

export default function SignupPage() {
  const navigate = useNavigate()
  const [showPw, setShowPw] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<FormValues>()

  async function onSubmit({ username, email, password }: FormValues) {
    let firebaseUser = null
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password)
      firebaseUser = user
      const token = await user.getIdToken()
      localStorage.setItem('token', token)
      await registerUser(username, user.photoURL)
      navigate('/')
    } catch {
      if (firebaseUser) {
        await firebaseUser.delete().catch(() => {})
        localStorage.removeItem('token')
      }
      setError('root', { message: 'アカウントの作成に失敗しました' })
    }
  }

  async function handleGoogle() {
    let firebaseUser = null
    let isNewUser = false
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider())
      firebaseUser = result.user
      isNewUser = getAdditionalUserInfo(result)?.isNewUser ?? false
      const token = await result.user.getIdToken()
      localStorage.setItem('token', token)
      await registerUser(result.user.displayName ?? '', result.user.photoURL)
      navigate('/')
    } catch {
      if (firebaseUser && isNewUser) {
        await firebaseUser.delete().catch(() => {})
        localStorage.removeItem('token')
      }
      setError('root', { message: 'Googleサインアップに失敗しました' })
    }
  }

  return (
    <div className={styles.page}>
      <section className={styles.left}>
        <header>
          <img src="/brand-concept-logo.png" alt="Loupe" className={styles.logo} />
        </header>
        <div className={styles.heroText}>
          <h1 className={styles.heroTitle}>Trade with<br />confidence.</h1>
          <p className={styles.heroSubtext}>AI-powered damage detection helps you understand the true condition of every item.</p>
        </div>
        <img src="/ConceptImage.png" alt="Condition analysis preview" className={styles.productImage} />
      </section>

      <section className={styles.right}>
        <div className={styles.topNav}>
          <span className={styles.topNavText}>Already have an account?</span>
          <Link to="/login" className={styles.topNavLink}>Log in</Link>
        </div>

        <div className={styles.formArea}>
          <h2 className={styles.heading}>Create your account</h2>
          <p className={styles.subtext}>Join Loupe and start trading with confidence.</p>

          <div className={styles.oauthArea}>
            <button type="button" className={styles.googleBtn} onClick={handleGoogle}>
              <svg width="19" height="19" viewBox="0 0 48 48">
                <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" />
                <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" />
                <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34A21.99 21.99 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z" />
                <path fill="#EA4335" d="M24 9.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 2.97 29.93 1 24 1 15.4 1 7.96 5.93 4.34 13.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z" />
              </svg>
              Continue with Google
            </button>
          </div>

          <div className={styles.divider}>
            <span className={styles.dividerLine} />
            <span className={styles.dividerText}>or</span>
            <span className={styles.dividerLine} />
          </div>

          <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                className={styles.input}
                {...register('email', { required: '必須です' })}
              />
              {errors.email && <p className={styles.errorMsg}>{errors.email.message}</p>}
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Password</label>
              <div className={styles.inputWrapper}>
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Create a password"
                  className={styles.inputWithToggle}
                  {...register('password', { required: '必須です', minLength: { value: 6, message: '6文字以上で入力してください' } })}
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPw(v => !v)}
                  aria-label="Toggle password visibility"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
              {errors.password && <p className={styles.errorMsg}>{errors.password.message}</p>}
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Username</label>
              <input
                type="text"
                placeholder="Choose a username"
                className={styles.input}
                {...register('username', { required: '必須です' })}
              />
              {errors.username && <p className={styles.errorMsg}>{errors.username.message}</p>}
            </div>

            {errors.root && <p className={styles.errorMsg}>{errors.root.message}</p>}

            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              Sign up
            </button>
          </form>

          <p className={styles.termsText}>
            By signing up, you agree to our{' '}
            <a href="#" className={styles.termsLink}>Terms of Service</a> and{' '}
            <a href="#" className={styles.termsLink}>Privacy Policy</a>.
          </p>
        </div>
      </section>
    </div>
  )
}

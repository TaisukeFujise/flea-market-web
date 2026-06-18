import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, getAdditionalUserInfo } from 'firebase/auth'
import { auth } from '../../firebase'
import { registerUser } from '../../utils/auth'

type FormValues = { username: string; email: string; password: string; confirmPassword: string }

export default function SignupPage() {
  const navigate = useNavigate()
  const { register, handleSubmit, watch, formState: { errors, isSubmitting }, setError } = useForm<FormValues>()

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
      const token = result.user.getIdToken()
      localStorage.setItem('token', await token)
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
    <div>
      <h1>サインアップ</h1>
      <button type="button" onClick={handleGoogle}>Googleでサインアップ</button>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label>ユーザー名</label>
          <input type="text" {...register('username', { required: '必須です' })} />
          {errors.username && <p>{errors.username.message}</p>}
        </div>
        <div>
          <label>メールアドレス</label>
          <input type="email" {...register('email', { required: '必須です' })} />
          {errors.email && <p>{errors.email.message}</p>}
        </div>
        <div>
          <label>パスワード</label>
          <input type="password" {...register('password', { required: '必須です', minLength: { value: 6, message: '6文字以上で入力してください' } })} />
          {errors.password && <p>{errors.password.message}</p>}
        </div>
        <div>
          <label>パスワード確認</label>
          <input type="password" {...register('confirmPassword', { required: '必須です', validate: v => v === watch('password') || 'パスワードが一致しません' })} />
          {errors.confirmPassword && <p>{errors.confirmPassword.message}</p>}
        </div>
        {errors.root && <p>{errors.root.message}</p>}
        <button type="submit" disabled={isSubmitting}>アカウントを作成</button>
      </form>
      <p>すでにアカウントをお持ちの方は<Link to="/login">こちら</Link></p>
    </div>
  )
}

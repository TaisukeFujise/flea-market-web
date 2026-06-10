import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '../../firebase'
import { registerUser } from '../../utils/auth'

type FormValues = { email: string; password: string; confirmPassword: string }

export default function SignupPage() {
  const navigate = useNavigate()
  const { register, handleSubmit, watch, formState: { errors, isSubmitting }, setError } = useForm<FormValues>()

  async function onSubmit({ email, password }: FormValues) {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password)
      const token = await user.getIdToken()
      localStorage.setItem('token', token)
      await registerUser(user.displayName ?? email, user.photoURL ?? '')
      navigate('/')
    } catch {
      setError('root', { message: 'アカウントの作成に失敗しました' })
    }
  }

  async function handleGoogle() {
    try {
      const { user } = await signInWithPopup(auth, new GoogleAuthProvider())
      const token = await user.getIdToken()
      localStorage.setItem('token', token)
      await registerUser(user.displayName ?? '', user.photoURL ?? '')
      navigate('/')
    } catch {
      setError('root', { message: 'Googleサインアップに失敗しました' })
    }
  }

  return (
    <div>
      <h1>サインアップ</h1>
      <button type="button" onClick={handleGoogle}>Googleでサインアップ</button>
      <form onSubmit={handleSubmit(onSubmit)}>
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

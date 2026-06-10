import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '../../firebase'
import { registerUser } from '../../utils/auth'

type FormValues = { email: string; password: string }

export default function LoginPage() {
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<FormValues>()

  async function onSubmit({ email, password }: FormValues) {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password)
      const token = await user.getIdToken()
      localStorage.setItem('token', token)
      navigate('/')
    } catch {
      setError('root', { message: 'メールアドレスまたはパスワードが正しくありません' })
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
      setError('root', { message: 'Googleログインに失敗しました' })
    }
  }

  return (
    <div>
      <h1>ログイン</h1>
      <button type="button" onClick={handleGoogle}>Googleでログイン</button>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label>メールアドレス</label>
          <input type="email" {...register('email', { required: '必須です' })} />
          {errors.email && <p>{errors.email.message}</p>}
        </div>
        <div>
          <label>パスワード</label>
          <input type="password" {...register('password', { required: '必須です' })} />
          {errors.password && <p>{errors.password.message}</p>}
        </div>
        {errors.root && <p>{errors.root.message}</p>}
        <button type="submit" disabled={isSubmitting}>ログイン</button>
      </form>
      <p>アカウントをお持ちでない方は<Link to="/signup">こちら</Link></p>
    </div>
  )
}

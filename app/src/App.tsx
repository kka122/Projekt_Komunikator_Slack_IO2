import './App.css'

function App() {
  function handleRegister(e) {
    e.preventDefault()

    fetch('http://localhost:5000/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        firstname: e.target.firstname.value,
        lastname: e.target.lastname.value,
        email: e.target.email.value,
        password: e.target.password.value,
        avatar: ""
      })
    }).then(res => res.json())
      .then(data => {
        console.log(data)
        alert('Registration successful!')
      })
      .catch(err => {
        console.error(err)
        alert('Registration failed!')
      })
  }

  function handleLogin(e) {
    e.preventDefault()

    fetch('http://localhost:5000/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: e.target.email.value,
        password: e.target.password.value
      })
    }).then(res => res.json())
      .then(data => {
        console.log(data)
        alert('Login successful!')
      })
      .catch(err => {
        console.error(err)
        alert('Login failed!')
      })
  }

  return (
    <>
      <h2>Register</h2>
      <form onSubmit={handleRegister}>
        <input type="text" name="firstname" placeholder="First name" required/>
        <input type="text" name="lastname" placeholder="Last name" required/>
        <input type="text" name="email" placeholder="Email" required/>
        <input type="password" name="password" placeholder="Password" required/>
        <button type="submit">Register</button>
      </form>

      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input type="text" name="email" placeholder="Email" required/>
        <input type="password" name="password" placeholder="Password" required/>
        <button type="submit">Login</button>
      </form>
    </>
  )
}

export default App

import { useState } from "react"
import LoginView from "./views/LoginView.jsx"
import DashboardView from "./views/DashboardView.jsx"

export default function App() {
  const [user, setUser] = useState(null)

  if (!user) {
    return <LoginView onLogin={setUser} />
  }

  return <DashboardView user={user} onLogout={() => setUser(null)} />
}

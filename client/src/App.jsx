import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Auth from './pages/Auth'
import { useEffect } from 'react'
import axios from "axios"

export const serverUrl = import.meta.env.VITE_BACKEND_URL;

function App() {
  useEffect(() => {
    const getUser = async() => {
      try {
        const result = await axios.get(serverUrl + "/api/user/me", {withCredentials : true})
        console.log("Current User Details : " , result.data)
      } catch (error) {
        console.log(`Error while fetching current user : ${error}`)
      }
    }
    getUser()
  },[])
  return (
    <Routes>
      <Route path='/' element={<Home/>}/>
      <Route path='/auth' element={<Auth/>}/>
    </Routes>
  )
}

export default App
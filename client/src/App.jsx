import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Auth from './pages/Auth'
import { useEffect } from 'react'
import axios from "axios"
import { useDispatch } from 'react-redux'
import { setUserData } from './redux/userSlice'

export const serverUrl = import.meta.env.VITE_BACKEND_URL;

function App() {

  const dispatch = useDispatch();

  useEffect(() => {
    const getUser = async() => {
      try {
        const result = await axios.get(serverUrl + "/api/user/me", {withCredentials : true})
        dispatch(setUserData(result.data))
      } catch (error) {
        console.log(`Error while fetching current user : ${error}`)
        dispatch(setUserData(null))
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
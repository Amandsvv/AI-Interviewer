import React from 'react'
import { useEffect } from 'react';
import { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import { serverUrl } from '../App';

function InterviewHistory() {
  const [interviews, setInterviews] = useState();
  const navigate = useNavigate();

  useEffect(() => {
    const getMyInterviews = async()=>{
      try {
        const result = await axios.get(serverUrl + "/api/interview/get-interview", {withCredentials : true});
        console.log(result.data);
        setInterviews(result.data);
      } catch (error) {
        console.log(error)       
      }
    }

    getMyInterviews()
  },[])

  return (
    <div>

    </div>
  )
}

export default InterviewHistory
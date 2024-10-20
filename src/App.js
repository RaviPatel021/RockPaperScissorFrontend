import React, { useState } from 'react';
import axios from 'axios';
import './App.css'; // Optional: for styling

function App() {
  const [userChoice, setUserChoice] = useState('');
  const [computerChoice, setComputerChoice] = useState('');
  const [result, setResult] = useState('');
  const [victories, setVictories] = useState(0);
  const [losses, setLosses] = useState(0);
  const [ties, setTies] = useState(0);

  const choices = ['rock', 'paper', 'scissors'];

  const handleClick = (choice) => {
    setUserChoice(choice);

    // Send user's choice to the backend
    axios.post('https://rockpaperscissorbackend.onrender.com/play', 
      { choice },
      {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
        withCredentials: true,
        crossDomain: true,
      })
      .then(response => {
        setComputerChoice(response.data.computer_choice);
        setResult(response.data.result);

        // Update the win/loss/tie counters
        if (response.data.result === 'You win!') {
          setVictories(victories + 1);
        } else if (response.data.result === 'Computer wins!') {
          setLosses(losses + 1);
        } else {
          setTies(ties + 1);
        }
      })
      .catch(error => {
        console.error('Error:', error);
        setResult('Error: Something went wrong! Please try again.');
      });
  };

  // Calculate percentages
  const winPercentage = (losses + victories + ties) > 0 ? (victories / (losses + victories + ties)) * 100 : 0;
  const lossPercentage = (losses + victories + ties) > 0 ? (losses / (losses + victories + ties)) * 100 : 0;
  const tiePercentage = (losses + victories + ties) > 0 ? (ties / (losses + victories + ties)) * 100 : 0;

  return (
    <div className="App">
      <h1>Rock Paper Scissors</h1>
      <div className="choices">
        {choices.map((choice) => (
          <button key={choice} onClick={() => handleClick(choice)}>
            {choice}
          </button>
        ))}
      </div>
      {userChoice && <p>Your choice: {userChoice}</p>}
      {computerChoice && <p>Computer's choice: {computerChoice}</p>}
      {result && <p>{result}</p>}

      {/* Scoreboard */}
      <div className="scoreboard">
        <h3>Scoreboard</h3>
        <p>Victories: {victories}</p>
        <p>Losses: {losses}</p>
        <p>Ties: {ties}</p>
      </div>

      {/* Trackbar */}
      <div className="trackbar-container">
        <div className="trackbar">
          <div className="win-bar" style={{ width: `${winPercentage}%` }}>
            {winPercentage.toFixed(1)}%
          </div>
          <div className="loss-bar" style={{ width: `${lossPercentage}%` }}>
            {lossPercentage.toFixed(1)}%
          </div>
          <div className="tie-bar" style={{ width: `${tiePercentage}%` }}>
            {tiePercentage.toFixed(1)}%
          </div>
        </div>
        <p>Total Games: {(losses + victories + ties)}</p>
      </div>
    </div>
  );
}

export default App;

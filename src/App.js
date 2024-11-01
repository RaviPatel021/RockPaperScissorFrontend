import React, { useState, useCallback, useTransition } from 'react';
import axios from 'axios';
import './App.css'; // Optional: for styling

function App() {
  const [userChoice, setUserChoice] = useState('');
  const [computerChoice, setComputerChoice] = useState('');
  const [result, setResult] = useState('');
  const [victories, setVictories] = useState(0);
  const [losses, setLosses] = useState(0);
  const [ties, setTies] = useState(0);
  const [gameHistory, setGameHistory] = useState([]); // To track each move
  const [isButtonDisabled, setIsButtonDisabled] = useState(false); // Disable buttons temporarily
  const [isRandomChoice, setIsRandomChoice] = useState(false); // Toggle for random choice
  const [isPending, startTransition] = useTransition();
  const choices = ['rock', 'paper', 'scissors'];

  // Debounce function to handle rapid clicks
  const debounce = (fn, delay) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  };

  const handleClick = useCallback(
    debounce((choice) => {
      setUserChoice(choice);
      setIsButtonDisabled(true); // Disable buttons temporarily

      if(isRandomChoice){
        // Generate a random choice for the computer
        const randomChoice = choices[Math.floor(Math.random() * choices.length)];
        setComputerChoice(randomChoice);
        const outcome = getResult(choice, randomChoice);

        setResult(outcome);

        // Update the win/loss/tie counters using previous state
        setVictories((prevVictories) =>
          outcome === 'You win!' ? prevVictories + 1 : prevVictories
        );
        setLosses((prevLosses) =>
          outcome === 'Computer wins!' ? prevLosses + 1 : prevLosses
        );
        setTies((prevTies) =>
          outcome === "It's a tie!" ? prevTies + 1 : prevTies
        );

        setIsButtonDisabled(false);

        // Store the result in the game history
        setGameHistory((prevHistory) => [
          ...prevHistory,
          { userChoice: choice, computerChoice: randomChoice, result: outcome, random: true },
        ]);
      }
      else{

        // Send user's choice to the backend
        axios
          .post(
            'https://rockpaperscissorbackend.onrender.com/play',
            { choice },
            {
              headers: {
                'Content-Type': 'application/json; charset=utf-8',
              },
              withCredentials: true,
              crossDomain: true,
            }
          )
          .then((response) => {
            const computer = response.data.computer_choice;
            const outcome = response.data.result;

            setComputerChoice(computer);
            setResult(outcome);

            // Update the win/loss/tie counters using previous state
            setVictories((prevVictories) =>
              outcome === 'You win!' ? prevVictories + 1 : prevVictories
            );
            setLosses((prevLosses) =>
              outcome === 'Computer wins!' ? prevLosses + 1 : prevLosses
            );
            setTies((prevTies) =>
              outcome === "It's a tie!" ? prevTies + 1 : prevTies
            );

            // Store the result in the game history
            setGameHistory((prevHistory) => [
              ...prevHistory,
              { userChoice: choice, computerChoice: computer, result: outcome, random: false},
            ]);
          })
          .catch((error) => {
            console.error('Error:', error);
            setResult('Error: Something went wrong! Please try again.');
          })
          .finally(() => {
            // Enable the button after a short delay (debounced)
              setIsButtonDisabled(false);
            });
      }
    }, 500), // 500ms debounce delay
    [isRandomChoice]
  );

  // Function to determine the outcome based on user and computer choices
  const getResult = (userChoice, computerChoice) => {
    if (userChoice === computerChoice) return "It's a tie!";
    if (
      (userChoice === 'rock' && computerChoice === 'scissors') ||
      (userChoice === 'scissors' && computerChoice === 'paper') ||
      (userChoice === 'paper' && computerChoice === 'rock')
    ) {
      return 'You win!';
    }
    return 'Computer wins!';
  };

  // Calculate percentages
  const winPercentage =
    losses + victories + ties > 0 ? (victories / (losses + victories + ties)) * 100 : 0;
  const lossPercentage =
    losses + victories + ties > 0 ? (losses / (losses + victories + ties)) * 100 : 0;
  const tiePercentage =
    losses + victories + ties > 0 ? (ties / (losses + victories + ties)) * 100 : 0;

  // Generate CSV file with game history
  const generateCSV = () => {
    const header = ['User Choice', 'Computer Choice', 'Result', 'Random'];
    const rows = gameHistory.map((game) => [game.userChoice, game.computerChoice, game.result, game.random]);

    const csvContent = [header, ...rows]
      .map((row) => row.join(','))
      .join('\n');

    // Get the current timestamp in YYYY-MM-DD_HH-MM-SS format
    const timestamp = new Date().toISOString().replace(/[:]/g, '-').split('.')[0];

    // Create a downloadable CSV file with timestamp in the filename
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      link.href = URL.createObjectURL(blob);
      link.download = `game_history_${timestamp}.csv`; // Use the timestamp in the file name
      link.click();
    }
  };

  const handleToggleRandom = () => {
    if (window.confirm('Switching modes will reset your score. Do you wish to continue?')) {
      startTransition(() => {
        setIsRandomChoice((prev) => !prev);
        setVictories(0);
        setLosses(0);
        setTies(0);
        setGameHistory([]);
        setUserChoice('');
        setComputerChoice('');
        setResult('');
      });
    }
  };

  return (
    <div className="App">
      <h1>Rock Paper Scissors</h1>
      {/* Toggle Button on the Top Right */}
      <button
        className={`top-right-button ${isRandomChoice ? 'active' : 'inactive'}`}
        onClick={handleToggleRandom}
        disabled={isPending} // Disable button while transition is pending
      >
        {isRandomChoice ? 'Random  is On' : 'Random Mode is Off'}
      </button>
      <div className="choices">
        {choices.map((choice) => (
          <button
            key={choice}
            onClick={() => handleClick(choice)}
            disabled={isButtonDisabled} // Disable button during processing
          >
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
        <p>Total Games: {losses + victories + ties}</p>
      </div>

      {/* Download CSV Button */}
      {losses + victories + ties > 0 && (
        <button onClick={generateCSV} className="download-btn">
          Download Game History
        </button>
      )}
    </div>
  );
}

export default App;

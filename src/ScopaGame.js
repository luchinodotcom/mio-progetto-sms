const ScopaGame = ({ players }) => {
    const [deck, setDeck] = useState([]);
    const [tableCards, setTableCards] = useState([]);
    const [hands, setHands] = useState({});
    const [captures, setCaptures] = useState({});
    const [scores, setScores] = useState({});
    const [currentTurn, setCurrentTurn] = useState(players[0]);
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState(null);
  
    useEffect(() => {
      initializeGame();
    }, []);
  
    const initializeGame = () => {
      const newDeck = createDeck();
      const shuffledDeck = shuffleDeck(newDeck);
      dealInitialCards(shuffledDeck);
      
      const initialHands = {};
      const initialCaptures = {};
      const initialScores = {};
      players.forEach(player => {
        initialHands[player] = [];
        initialCaptures[player] = [];
        initialScores[player] = 0;
      });
      
      setHands(initialHands);
      setCaptures(initialCaptures);
      setScores(initialScores);
    };
  
    const createDeck = () => {
      const suits = ['Coppe', 'Bastoni', 'Denari', 'Spade'];
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const deck = [];
      for (let suit of suits) {
        for (let value of values) {
          deck.push({ suit, value });
        }
      }
      return deck;
    };
  
    const shuffleDeck = (deck) => {
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
      return deck;
    };
  
    const dealInitialCards = (deck) => {
      const initialHands = {};
      players.forEach((player, index) => {
        initialHands[player] = deck.slice(index * 3, (index + 1) * 3);
      });
      setHands(initialHands);
      setTableCards(deck.slice(players.length * 3, players.length * 3 + 4));
      setDeck(deck.slice(players.length * 3 + 4));
    };
  
    const playCard = (player, card) => {
      if (player !== currentTurn || gameOver) return;
  
      const newHands = { ...hands };
      newHands[player] = newHands[player].filter(c => c !== card);
      setHands(newHands);
  
      const capturedCards = findCaptureCards(card, tableCards);
  
      if (capturedCards.length > 0) {
        const newCaptures = { ...captures };
        newCaptures[player] = [...newCaptures[player], card, ...capturedCards];
        setCaptures(newCaptures);
        setTableCards(tableCards.filter(c => !capturedCards.includes(c)));
  
        if (tableCards.length === capturedCards.length) {
          // Scopa!
          newCaptures[player].push({ suit: 'Scopa', value: 'Scopa' });
        }
      } else {
        setTableCards([...tableCards, card]);
      }
  
      const nextPlayer = players[(players.indexOf(currentTurn) + 1) % players.length];
      setCurrentTurn(nextPlayer);
  
      if (deck.length === 0 && Object.values(newHands).every(hand => hand.length === 0)) {
        endRound();
      } else if (newHands[player].length === 0) {
        dealCards();
      }
    };
  
    const findCaptureCards = (playedCard, tableCards) => {
      const capturedCards = tableCards.filter(card => card.value === playedCard.value);
      if (capturedCards.length > 0) return capturedCards;
  
      const sum = tableCards.reduce((acc, card) => acc + card.value, 0);
      if (sum === playedCard.value) return tableCards;
  
      return [];
    };
  
    const dealCards = () => {
      if (deck.length >= players.length * 3) {
        const newHands = { ...hands };
        players.forEach((player, index) => {
          newHands[player] = deck.slice(index * 3, (index + 1) * 3);
        });
        setHands(newHands);
        setDeck(deck.slice(players.length * 3));
      } else if (deck.length > 0) {
        const newHands = { ...hands };
        const cardsPerPlayer = Math.floor(deck.length / players.length);
        players.forEach((player, index) => {
          newHands[player] = deck.slice(index * cardsPerPlayer, (index + 1) * cardsPerPlayer);
        });
        setHands(newHands);
        setDeck([]);
      }
    };
  
    const endRound = () => {
      // Assegna le carte rimanenti all'ultimo giocatore che ha catturato
      const lastCapturer = players.reduce((last, player) => 
        captures[player].length > captures[last].length ? player : last
      , players[0]);
      
      const newCaptures = { ...captures };
      newCaptures[lastCapturer] = [...newCaptures[lastCapturer], ...tableCards];
      setCaptures(newCaptures);
      setTableCards([]);
  
      calculateScores();
      setGameOver(true);
    };
  
    const calculateScores = () => {
      const newScores = { ...scores };
      players.forEach(player => {
        let score = 0;
        const playerCaptures = captures[player];
        
        // Punto per la maggioranza delle carte
        if (playerCaptures.length > 20) score += 1;
        
        // Punto per la maggioranza dei denari
        const denariCount = playerCaptures.filter(card => card.suit === 'Denari').length;
        if (denariCount > 5) score += 1;
        
        // Punto per il settebello (7 di Denari)
        if (playerCaptures.some(card => card.suit === 'Denari' && card.value === 7)) score += 1;
        
        // Punti per le scope
        const scopeCount = playerCaptures.filter(card => card.suit === 'Scopa').length;
        score += scopeCount;
        
        newScores[player] = score;
      });
      setScores(newScores);
  
      // Determina il vincitore
      const maxScore = Math.max(...Object.values(newScores));
      const winners = players.filter(player => newScores[player] === maxScore);
      setWinner(winners.length === 1 ? winners[0] : 'Pareggio');
    };
  
    return (
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>Gioco della Scopa</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography>Carte sul tavolo: {tableCards.length}</Typography>
              {tableCards.map((card, index) => (
                <span key={index}>{card.value} di {card.suit}, </span>
              ))}
            </Paper>
          </Grid>
          {players.map(player => (
            <Grid item xs={12} key={player}>
              <Paper elevation={3} sx={{ p: 2 }}>
                <Typography>{player} - Mano:</Typography>
                {hands[player]?.map((card, index) => (
                  <Button key={index} onClick={() => playCard(player, card)} disabled={currentTurn !== player || gameOver}>
                    {card.value} di {card.suit}
                  </Button>
                ))}
              </Paper>
            </Grid>
          ))}
          <Grid item xs={12}>
            <Typography>Punteggi: {players.map(player => `${player}: ${scores[player]}`).join(', ')}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography>Turno attuale: {currentTurn}</Typography>
          </Grid>
        </Grid>
  
        <Dialog open={gameOver} onClose={() => setGameOver(false)}>
          <DialogTitle>Partita Terminata</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {winner === 'Pareggio' ? 'La partita è finita in pareggio!' : `Il vincitore è ${winner}!`}
            </DialogContentText>
            <Typography>Punteggi finali:</Typography>
            {players.map(player => (
              <Typography key={player}>{player}: {scores[player]}</Typography>
            ))}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => initializeGame()}>Nuova Partita</Button>
            <Button onClick={() => setGameOver(false)}>Chiudi</Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
    return (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>Gioco della Scopa</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Paper elevation={3} sx={{ p: 2 }}>
                <Typography>Carte sul tavolo: {tableCards.length}</Typography>
                {tableCards.map((card, index) => (
                  <span key={index}>{card.value} di {card.suit}, </span>
                ))}
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper elevation={3} sx={{ p: 2 }}>
                <Typography>La tua mano:</Typography>
                {playerHand.map((card, index) => (
                  <Button key={index} onClick={() => playCard(card)}>
                    {card.value} di {card.suit}
                  </Button>
                ))}
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Typography>Punteggio - Tu: {playerScore}, Computer: {computerScore}</Typography>
            </Grid>
          </Grid>
        </Box>
      );
  };
  
  export default ScopaGame;
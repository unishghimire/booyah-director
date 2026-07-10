const express = require('express');
const path = require('path');
const app = express();
app.use(express.json());

const routes = ['getOverlayData','initializeTournament','addTeam','startNextMatch','updateMatchState','addKill','eliminatePlayer','setTeamPlacement','calculateMVP','setMVPAndShowScreen','setChampionAndShowScreen','switchOverlayScreen','declareChampions'];
routes.forEach(r => { app.all(`/api/${r}`, require(`./api/${r}`)); });

app.listen(3001, () => console.log('API server on port 3001'));
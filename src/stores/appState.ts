import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref } from 'vue';
import type { Team, Game, Formation, FormationType, PositionDef } from '../types';
import { api } from '../services/api';

export const useAppStore = defineStore('app', () => {
  const teams = ref<Team[]>([]);
  const games = ref<Game[]>([]);
  const customFormations = ref<Formation[]>([]);
  const isLoading = ref(false);
  const hasLoaded = ref(false);
  let loadPromise: Promise<void> | null = null;

  // --- Data Loading ---
  async function loadAll() {
    if (loadPromise) return loadPromise;
    
    loadPromise = (async () => {
      isLoading.value = true;
      try {
        const [teamsData, gamesData, formationsData] = await Promise.all([
          api.get<{ teams: Team[] }>('/teams'),
          api.get<{ games: Game[] }>('/games'),
          api.get<{ formations: Formation[] }>('/formations').catch(() => ({ formations: [] })), // Graceful fallback
        ]);
        teams.value = teamsData.teams;
        games.value = gamesData.games;
        customFormations.value = formationsData.formations;
        hasLoaded.value = true;
      } catch (err) {
        console.error('Failed to load data:', err);
        hasLoaded.value = false;
      } finally {
        isLoading.value = false;
        loadPromise = null;
      }
    })();
    
    return loadPromise;
  }

  // --- Team Actions ---
  async function addTeam(name: string, color: string, icon: string, matchType: string, defaultFormationId: string) {
    const data = await api.post<{ team: Team }>('/teams', { name, color, icon, matchType, defaultFormationId });
    teams.value.unshift(data.team);
    return data.team;
  }

  async function deleteTeam(id: string) {
    await api.delete(`/teams/${id}`);
    teams.value = teams.value.filter(t => t.id !== id);
    games.value = games.value.filter(g => g.teamId !== id);
  }

  async function updateTeamIcon(teamId: string, icon: string) {
    const data = await api.put<{ team: Team }>(`/teams/${teamId}`, { icon });
    const idx = teams.value.findIndex(t => t.id === teamId);
    if (idx !== -1) teams.value[idx] = data.team;
  }

  async function updateTeamName(teamId: string, name: string) {
    const data = await api.put<{ team: Team }>(`/teams/${teamId}`, { name });
    const idx = teams.value.findIndex(t => t.id === teamId);
    if (idx !== -1) teams.value[idx] = data.team;
  }

  async function updateTeamColor(teamId: string, color: string) {
    const data = await api.put<{ team: Team }>(`/teams/${teamId}`, { color });
    const idx = teams.value.findIndex(t => t.id === teamId);
    if (idx !== -1) teams.value[idx] = data.team;
  }

  async function appendPlayersToTeam(teamId: string, names: string[]) {
    const data = await api.post<{ team: Team }>(`/teams/${teamId}/players`, { names });
    const idx = teams.value.findIndex(t => t.id === teamId);
    if (idx !== -1) teams.value[idx] = data.team;
  }

  async function removePlayerFromTeam(teamId: string, playerId: string) {
    const data = await api.delete<{ team: Team }>(`/teams/${teamId}/players/${playerId}`);
    const idx = teams.value.findIndex(t => t.id === teamId);
    if (idx !== -1) teams.value[idx] = data.team;

    // Update any game lineups that reference this player
    games.value.filter(g => g.teamId === teamId).forEach(game => {
      game.lineups.forEach(lineup => {
        lineup.positions.forEach(pos => {
          if (pos.playerId === playerId) pos.playerId = null;
        });
      });
    });
  }

  function getTeam(teamId: string): Team | undefined {
    return teams.value.find(t => t.id === teamId);
  }

  // --- Game Actions ---
  async function addGame(name: string, teamId: string, date?: string) {
    const data = await api.post<{ game: Game }>('/games', { name, teamId, date });
    games.value.unshift(data.game);
    return data.game;
  }

  async function deleteGame(id: string) {
    await api.delete(`/games/${id}`);
    games.value = games.value.filter(g => g.id !== id);
  }

  function getGame(gameId: string): Game | undefined {
    return games.value.find(g => g.id === gameId);
  }

  // --- Lineup Actions ---
  async function addLineupToGame(gameId: string, name: string, formation: Formation) {
    const positions = formation.positions.map(p => ({
      id: crypto.randomUUID(),
      label: p.label,
      x: p.x,
      y: p.y,
      playerId: null,
    }));

    const data = await api.post<{ game: Game }>(`/games/${gameId}/lineups`, {
      name,
      formationId: formation.id,
      positions,
    });

    const idx = games.value.findIndex(g => g.id === gameId);
    if (idx !== -1) games.value[idx] = data.game;
    return data.game.lineups[data.game.lineups.length - 1];
  }

  async function copyLineupInGame(gameId: string, lineupId: string) {
    const data = await api.post<{ game: Game }>(`/games/${gameId}/lineups/${lineupId}/copy`);
    const idx = games.value.findIndex(g => g.id === gameId);
    if (idx !== -1) games.value[idx] = data.game;
    return data.game.lineups[data.game.lineups.length - 1];
  }

  async function copyLineupsFromGame(targetGameId: string, sourceGameId: string) {
    const data = await api.post<{ game: Game }>(`/games/${targetGameId}/copy-from/${sourceGameId}`);
    const idx = games.value.findIndex(g => g.id === targetGameId);
    if (idx !== -1) games.value[idx] = data.game;
  }

  async function deleteLineup(gameId: string, lineupId: string) {
    const data = await api.delete<{ game: Game }>(`/games/${gameId}/lineups/${lineupId}`);
    const idx = games.value.findIndex(g => g.id === gameId);
    if (idx !== -1) games.value[idx] = data.game;
  }

  async function assignPlayerToPosition(gameId: string, lineupId: string, positionId: string, playerId: string | null) {
    const game = getGame(gameId);
    if (!game) return;
    const lineup = game.lineups.find(l => l.id === lineupId);
    if (!lineup) return;

    const targetPos = lineup.positions.find(p => p.id === positionId);
    if (!targetPos) return;

    if (playerId) {
      const sourcePos = lineup.positions.find(p => p.playerId === playerId && p.id !== positionId);
      const displacedPlayerId = targetPos.playerId;

      if (sourcePos) {
        if (displacedPlayerId) {
          sourcePos.playerId = displacedPlayerId;
        } else {
          sourcePos.playerId = null;
        }
      }
    }

    targetPos.playerId = playerId;

    // Persist the full lineup positions state
    await api.put(`/games/${gameId}/lineups/${lineupId}`, {
      positions: lineup.positions.map(p => ({
        id: p.id,
        label: p.label,
        x: p.x,
        y: p.y,
        playerId: p.playerId,
      })),
    });
  }

  async function updatePositionLocation(gameId: string, lineupId: string, positionId: string, x: number, y: number) {
    const game = getGame(gameId);
    if (!game) return;
    const lineup = game.lineups.find(l => l.id === lineupId);
    if (!lineup) return;
    const pos = lineup.positions.find(p => p.id === positionId);
    if (pos) {
      pos.x = x;
      pos.y = y;
    }

    // Persist
    await api.put(`/games/${gameId}/lineups/${lineupId}`, {
      positions: lineup.positions.map(p => ({
        id: p.id,
        label: p.label,
        x: p.x,
        y: p.y,
        playerId: p.playerId,
      })),
    });
  }

  async function updateLineupName(gameId: string, lineupId: string, name: string) {
    await api.put(`/games/${gameId}/lineups/${lineupId}`, { name });
    const game = getGame(gameId);
    if (!game) return;
    const lineup = game.lineups.find(l => l.id === lineupId);
    if (lineup) lineup.name = name;
  }

  // --- Formation Actions ---
  async function addCustomFormation(name: string, type: FormationType, positions: PositionDef[]) {
    const data = await api.post<{ formation: Formation }>('/formations', { name, type, positions });
    customFormations.value.unshift(data.formation);
    return data.formation;
  }

  async function deleteCustomFormation(id: string) {
    await api.delete(`/formations/${id}`);
    customFormations.value = customFormations.value.filter(f => f.id !== id);
  }

  function reset() {
    teams.value = [];
    games.value = [];
    customFormations.value = [];
    hasLoaded.value = false;
    isLoading.value = false;
  }

  return {
    teams,
    games,
    isLoading,
    hasLoaded,
    loadAll,
    addTeam,
    updateTeamIcon,
    updateTeamName,
    updateTeamColor,
    deleteTeam,
    appendPlayersToTeam,
    removePlayerFromTeam,
    getTeam,
    addGame,
    deleteGame,
    getGame,
    addLineupToGame,
    copyLineupInGame,
    copyLineupsFromGame,
    deleteLineup,
    assignPlayerToPosition,
    updatePositionLocation,
    updateLineupName,
    customFormations,
    addCustomFormation,
    deleteCustomFormation,
    reset,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAppStore, import.meta.hot));
}

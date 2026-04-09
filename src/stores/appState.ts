import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref } from 'vue';
import type { Team, Game, Lineup, Formation, FormationType, Player } from '../types';

export const useAppStore = defineStore('app', () => {
  const teams = ref<Team[]>([]);
  const games = ref<Game[]>([]);

  // Team Actions
  function addTeam(name: string, color: string, icon: string, matchType: FormationType, defaultFormationId: string) {
    const newTeam: Team = {
      id: crypto.randomUUID(),
      name, color, icon, matchType, defaultFormationId,
      players: []
    };
    teams.value.push(newTeam);
    return newTeam;
  }

  function deleteTeam(id: string) {
    teams.value = teams.value.filter(t => t.id !== id);
    // Cascade delete games associated with this team
    games.value = games.value.filter(g => g.teamId !== id);
  }

  function updateTeamIcon(teamId: string, icon: string) {
    const team = teams.value.find(t => t.id === teamId);
    if (team) {
      team.icon = icon;
    }
  }

  function updateTeamName(teamId: string, name: string) {
    const team = teams.value.find(t => t.id === teamId);
    if (team) {
      team.name = name;
    }
  }

  function updateTeamColor(teamId: string, color: string) {
    const team = teams.value.find(t => t.id === teamId);
    if (team) {
      team.color = color;
    }
  }

  function appendPlayersToTeam(teamId: string, names: string[]) {
    const team = teams.value.find(t => t.id === teamId);
    if (!team) return;
    names.forEach(name => {
      if (name.trim()) {
        team.players.push({
          id: crypto.randomUUID(),
          name: name.trim()
        });
      }
    });
  }

  function removePlayerFromTeam(teamId: string, playerId: string) {
    const team = teams.value.find(t => t.id === teamId);
    if (!team) return;
    team.players = team.players.filter(p => p.id !== playerId);

    // Remote player from all associated game lineups
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

  // Game Actions
  function addGame(name: string, teamId: string, date?: string) {
    const newGame: Game = { id: crypto.randomUUID(), name, date, teamId, lineups: [] };
    games.value.push(newGame);
    return newGame;
  }

  function deleteGame(id: string) {
    games.value = games.value.filter(g => g.id !== id);
  }

  function getGame(gameId: string): Game | undefined {
    return games.value.find(g => g.id === gameId);
  }

  // Lineup Actions
  function addLineupToGame(gameId: string, name: string, formation: Formation) {
    const game = getGame(gameId);
    if (!game) return;

    const newLineup: Lineup = {
      id: crypto.randomUUID(),
      name,
      formationId: formation.id,
      positions: formation.positions.map(p => ({ ...p, id: crypto.randomUUID(), playerId: null }))
    };
    game.lineups.push(newLineup);
    return newLineup;
  }

  function copyLineupInGame(gameId: string, lineupId: string) {
    const game = getGame(gameId);
    if (!game) return;

    const original = game.lineups.find(l => l.id === lineupId);
    if (!original) return;

    const newLineup: Lineup = {
      id: crypto.randomUUID(),
      name: original.name + ' (Copy)',
      formationId: original.formationId,
      positions: original.positions.map(p => ({ ...p, id: crypto.randomUUID() })) // Copy cleanly
    };
    game.lineups.push(newLineup);
    return newLineup;
  }

  function deleteLineup(gameId: string, lineupId: string) {
    const game = getGame(gameId);
    if (!game) return;
    game.lineups = game.lineups.filter(l => l.id !== lineupId);
  }

  function assignPlayerToPosition(gameId: string, lineupId: string, positionId: string, playerId: string | null) {
    const game = getGame(gameId);
    if (!game) return;
    const lineup = game.lineups.find(l => l.id === lineupId);
    if (!lineup) return;

    const targetPos = lineup.positions.find(p => p.id === positionId);
    if (!targetPos) return;

    if (playerId) {
      // Find where the dragged player is coming from (if they are already on the field)
      const sourcePos = lineup.positions.find(p => p.playerId === playerId && p.id !== positionId);
      const displacedPlayerId = targetPos.playerId;

      if (sourcePos) {
        if (displacedPlayerId) {
          // Two-way Swap: The player being overwritten goes to the origin position
          sourcePos.playerId = displacedPlayerId;
        } else {
          // One-way Move: Nobody was replaced, clear origin
          sourcePos.playerId = null;
        }
      }
    }

    // Assign the new player to exactly where they were dropped
    targetPos.playerId = playerId;
  }

  function updatePositionLocation(gameId: string, lineupId: string, positionId: string, x: number, y: number) {
    const game = getGame(gameId);
    if (!game) return;
    const lineup = game.lineups.find(l => l.id === lineupId);
    if (!lineup) return;
    const pos = lineup.positions.find(p => p.id === positionId);
    if (pos) {
      pos.x = x;
      pos.y = y;
    }
  }

  return {
    teams,
    games,
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
    deleteLineup,
    assignPlayerToPosition,
    updatePositionLocation,
  };
}, {
  persist: true
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAppStore, import.meta.hot));
}

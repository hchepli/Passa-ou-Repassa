/* ============ CONFIGURAÇÃO DO JOGO ============ */
const CONFIG = {
  // Regras
  SECONDS: 60,              // tempo por vez (segundos)
  POINTS: 10,               // pontos por acerto
  WARNING_SECONDS: 5,       // a partir de quantos segundos o timer fica vermelho
  MAX_QUESTIONS: 30,        // máximo de perguntas por jogo (use QUESTIONS.length para todas)
  SHUFFLE_QUESTIONS: true, // true = embaralha a ordem das perguntas
  SHUFFLE_OPTIONS: true,    // true = embaralha as alternativas
  ALERT_SECONDS: 10,      // a partir de quantos segundos o timer pisca (alerta sonoro)

  // Nomes padrão dos times
  TEAM_A_NAME: 'Merda',
  TEAM_B_NAME: 'Time B',
  NAME_MAX_LENGTH: 14,

  // Cores de feedback
  COLORS: {
    good: '#38d996',
    bad: '#ff5d6c',
    white: '#fff'
  },

  // Textos
  TEXTS: {
    correct: 'Resposta Correta!',
    wrong: 'Resposta Errada!',
    noWinner: 'Ninguém acertou desta vez.',
    gameOver: 'Fim de jogo!',
    draw: 'Empate!'
  },

  // Tempos de animação (segundos, exceto os terminados em _MS)
  TIMING: {
    FLASH_HOLD: 0.9,        // quanto tempo a tela verde/vermelha fica parada
    SPLASH_HOLD: 0.75,      // quanto tempo a faixa "Vez do Time X" fica parada
    PASS_DELAY_MS: 600,     // pausa ao passar a vez / acabar o tempo
    STARTER_DELAY_MS: 1400  // pausa depois de anunciar quem começa
  }
};
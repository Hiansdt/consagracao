import type { Phase } from '../logic/calendar'

export interface Art {
  src: string
  credit: string
  // CSS object-position: keeps the faces in view when the header crops the painting
  position: string
}

export const ART: Record<Phase, Art> = {
  preliminar: {
    src: '/art/preliminar.jpg',
    credit: 'Fra Angelico, Anunciação (c. 1440). Convento de San Marco, Florença.',
    position: '50% 45%',
  },
  semana1: {
    src: '/art/semana1.jpg',
    credit: 'Sassoferrato, A Virgem em oração (1640–1650). National Gallery, Londres.',
    position: '50% 20%',
  },
  semana2: {
    src: '/art/semana2.jpg',
    credit: 'Bartolomé Esteban Murillo, Imaculada Conceição "de Soult" (1678). Museu do Prado, Madri.',
    position: '50% 12%',
  },
  semana3: {
    src: '/art/semana3.jpg',
    credit: 'Giovanni Bellini, Madonna del Prato (c. 1505). National Gallery, Londres.',
    position: '50% 30%',
  },
  festa: {
    src: '/art/festa.jpg',
    credit: 'Fra Angelico, Coroação da Virgem (1430–1432). Museu do Louvre, Paris.',
    position: '50% 20%',
  },
}

export const PHASE_NAMES: Record<Phase, string> = {
  preliminar: 'Doze dias preliminares',
  semana1: 'Primeira semana: conhecimento de si mesmo',
  semana2: 'Segunda semana: conhecimento da santíssima Virgem',
  semana3: 'Terceira semana: conhecimento de Jesus Cristo',
  festa: 'Dia da consagração',
}

export const PHASE_SHORT: Record<Phase, string> = {
  preliminar: '12 dias',
  semana1: 'Conhecimento de si',
  semana2: 'Conhecimento de Maria',
  semana3: 'Conhecimento de Jesus',
  festa: 'Consagração',
}

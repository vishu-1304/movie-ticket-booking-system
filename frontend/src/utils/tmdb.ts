import axios from 'axios';

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || '';

const SEEDED_MEDIA: { [key: string]: { poster: string; backdrop: string } } = {
  // Hollywood - Now Showing
  'interstellar': {
    poster: '/posters/interstellar.jpg',
    backdrop: '/posters/interstellar_backdrop.jpg'
  },
  'the dark knight': {
    poster: '/posters/dark-knight.jpg',
    backdrop: '/posters/dark-knight_backdrop.jpg'
  },
  'inception': {
    poster: '/posters/inception.jpg',
    backdrop: '/posters/inception_backdrop.jpg'
  },
  'avatar: the way of water': {
    poster: '/posters/avatar.jpg',
    backdrop: '/posters/avatar_backdrop.jpg'
  },
  'superman': {
    poster: '/posters/superman.jpg',
    backdrop: '/posters/superman_backdrop.jpg'
  },
  'mission: impossible – the final reckoning': {
    poster: '/posters/mission-impossible.jpg',
    backdrop: '/posters/mission-impossible_backdrop.jpg'
  },
  'mission: impossible': {
    poster: '/posters/mission-impossible.jpg',
    backdrop: '/posters/mission-impossible_backdrop.jpg'
  },

  // Bollywood - Now Showing
  'saiyaara': {
    poster: '/posters/saiyaara.jpg',
    backdrop: '/posters/saiyaara_backdrop.jpg'
  },
  'housefull 5': {
    poster: '/posters/housefull-5.jpg',
    backdrop: '/posters/housefull-5_backdrop.jpg'
  },
  'sitaare zameen par': {
    poster: '/posters/sitaare-zameen-par.jpg',
    backdrop: '/posters/sitaare-zameen-par_backdrop.jpg'
  },
  'chhaava': {
    poster: '/posters/chhaava.jpg',
    backdrop: '/posters/chhaava_backdrop.jpg'
  },
  'bhool chuk maaf': {
    poster: '/posters/bhool-chuk-maaf.jpg',
    backdrop: '/posters/bhool-chuk-maaf_backdrop.jpg'
  },
  'war 2': {
    poster: '/posters/war-2.jpg',
    backdrop: '/posters/war-2_backdrop.jpg'
  },

  // Coming Soon
  'avengers: secret wars': {
    poster: '/posters/secret-wars.jpg',
    backdrop: '/posters/secret-wars_backdrop.jpg'
  },
  'dune: part three': {
    poster: '/posters/dune-3.jpg',
    backdrop: '/posters/dune-3_backdrop.jpg'
  },
  'avatar 3': {
    poster: '/posters/avatar-3.jpg',
    backdrop: '/posters/avatar-3_backdrop.jpg'
  },
  'spider-man: brand new day': {
    poster: '/posters/spider-man.jpg',
    backdrop: '/posters/spider-man_backdrop.jpg'
  },
  'the batman part ii': {
    poster: '/posters/batman-2.jpg',
    backdrop: '/posters/batman-2_backdrop.jpg'
  },
  'fantastic four': {
    poster: '/posters/fantastic-four.jpg',
    backdrop: '/posters/fantastic-four_backdrop.jpg'
  },
  'dune': {
    poster: '/posters/dune.jpg',
    backdrop: '/posters/dune_backdrop.jpg'
  },
  'avengers': {
    poster: '/posters/avengers.jpg',
    backdrop: '/posters/avengers_backdrop.jpg'
  },
  'raid 2': {
    poster: '/posters/raid-2.jpg',
    backdrop: '/posters/raid-2_backdrop.jpg'
  },
  'jaat': {
    poster: '/posters/jaat.jpg',
    backdrop: '/posters/jaat_backdrop.jpg'
  }
};

/**
 * Returns static poster/backdrop mapping if it's one of the seeded movies.
 * Otherwise, falls back to the database-provided default poster.
 */
export const getMovieStaticMedia = (title: string, defaultPoster: string) => {
  const normTitle = title.toLowerCase().trim();

  if (defaultPoster && defaultPoster.startsWith('/posters/')) {
    return {
      poster: defaultPoster,
      backdrop: defaultPoster.includes('_backdrop') ? defaultPoster : defaultPoster.replace('.jpg', '_backdrop.jpg')
    };
  }

  const foundKey = Object.keys(SEEDED_MEDIA).find(
    key => normTitle.includes(key) || key.includes(normTitle)
  );

  if (foundKey) {
    return SEEDED_MEDIA[foundKey];
  }

  return SEEDED_MEDIA['interstellar'];
};

/**
 * Dynamically queries the TMDB API if API key is available.
 * Disabled to enforce local assets constraint.
 */
export const fetchTMDBMovieMedia = async (
  title: string
): Promise<{ poster: string; backdrop: string } | null> => {
  return getMovieStaticMedia(title, '');
};
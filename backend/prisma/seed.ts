import { PrismaClient, Role, SeatType, SeatStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database...');
  await prisma.showSeat.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.show.deleteMany();
  await prisma.seat.deleteMany();
  await prisma.screen.deleteMany();
  await prisma.theatre.deleteMany();
  await prisma.city.deleteMany();
  await prisma.movie.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding roles and users...');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  const admin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@moviepass.com',
      password: hashedPassword,
      role: Role.ADMIN,
      phoneNumber: '9999999999',
    },
  });

  const user = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'user@moviepass.com',
      password: hashedPassword,
      role: Role.USER,
      phoneNumber: '8888888888',
    },
  });

  console.log('Seeding cities...');
  const cities = await Promise.all([
    prisma.city.create({ data: { name: 'Mumbai', slug: 'mumbai' } }),
    prisma.city.create({ data: { name: 'Bangalore', slug: 'bangalore' } }),
    prisma.city.create({ data: { name: 'Delhi', slug: 'delhi' } }),
  ]);

  console.log('Seeding movies...');
  const movies = await Promise.all([
    // Bollywood - Now Showing (Released before 2026-06-29)
    prisma.movie.create({
      data: {
        title: 'Saiyaara',
        description: 'A high-octane espionage action thriller following top secret agents on a global rescue mission.',
        duration: 142,
        language: 'Hindi',
        genre: 'Action, Thriller',
        director: 'Maneesh Sharma',
        cast: 'Salman Khan, Katrina Kaif, Emraan Hashmi',
        posterUrl: '/posters/saiyaara.jpg',
        releaseDate: new Date('2023-11-12'),
        rating: 'UA',
        isActive: true,
      },
    }),
    prisma.movie.create({
      data: {
        title: 'Housefull 5',
        description: 'The fifth installment of India\'s biggest comedy franchise set on a luxurious cruise ship with double the madness.',
        duration: 150,
        language: 'Hindi',
        genre: 'Comedy',
        director: 'Tarun Mansukhani',
        cast: 'Akshay Kumar, Riteish Deshmukh, Abhishek Bachchan',
        posterUrl: '/posters/housefull-5.jpg',
        releaseDate: new Date('2025-06-05'),
        rating: 'UA',
        isActive: true,
      },
    }),
    prisma.movie.create({
      data: {
        title: 'Sitaare Zameen Par',
        description: 'A heartwarming story about human resilience, mentoring, and the extraordinary potential inside every child.',
        duration: 145,
        language: 'Hindi',
        genre: 'Drama, Family',
        director: 'R. S. Prasanna',
        cast: 'Aamir Khan, Genelia D\'Souza, Darsheel Safary',
        posterUrl: '/posters/sitaare-zameen-par.jpg',
        releaseDate: new Date('2025-12-25'),
        rating: 'U',
        isActive: true,
      },
    }),
    prisma.movie.create({
      data: {
        title: 'Chhaava',
        description: 'An epic historical saga chronicling the heroic battles and life of Chhatrapati Sambhaji Maharaj.',
        duration: 165,
        language: 'Hindi',
        genre: 'Action, Biography, Drama',
        director: 'Laxman Utekar',
        cast: 'Vicky Kaushal, Rashmika Mandanna, Akshaye Khanna',
        posterUrl: '/posters/chhaava.jpg',
        releaseDate: new Date('2026-02-06'),
        rating: 'UA',
        isActive: true,
      },
    }),
    prisma.movie.create({
      data: {
        title: 'Bhool Chuk Maaf',
        description: 'A hilarious family comedy about mistaken identities, chaotic double roles, and unconditional laughter.',
        duration: 135,
        language: 'Hindi',
        genre: 'Comedy, Drama',
        director: 'Sajid Samji',
        cast: 'Varun Dhawan, Wamiqa Gabbi, Shraddha Kapoor',
        posterUrl: '/posters/bhool-chuk-maaf.jpg',
        releaseDate: new Date('2024-03-10'),
        rating: 'U',
        isActive: true,
      },
    }),
    prisma.movie.create({
      data: {
        title: 'War 2',
        description: 'A massive action espionage thriller in the YRF Spy Universe featuring a clash of giants.',
        duration: 155,
        language: 'Hindi',
        genre: 'Action, Thriller',
        director: 'Ayan Mukerji',
        cast: 'Hrithik Roshan, NTR Jr., Kiara Advani',
        posterUrl: '/posters/war-2.jpg',
        releaseDate: new Date('2026-05-01'),
        rating: 'UA',
        isActive: true,
      },
    }),

    // Hollywood - Now Showing (Released before 2026-06-29)
    prisma.movie.create({
      data: {
        title: 'Superman',
        description: 'A new cinematic beginning for the Man of Steel, as he tries to balance his Kryptonian heritage with his human life.',
        duration: 145,
        language: 'English',
        genre: 'Action, Sci-Fi, Adventure',
        director: 'James Gunn',
        cast: 'David Corenswet, Rachel Brosnahan, Nicholas Hoult',
        posterUrl: '/posters/superman.jpg',
        releaseDate: new Date('2025-07-11'),
        rating: 'UA',
        isActive: true,
      },
    }),
    prisma.movie.create({
      data: {
        title: 'Mission: Impossible – The Final Reckoning',
        description: 'Ethan Hunt and his IMF team embark on their most dangerous mission yet, trying to stop a rogue AI entity.',
        duration: 162,
        language: 'English',
        genre: 'Action, Adventure, Thriller',
        director: 'Christopher McQuarrie',
        cast: 'Tom Cruise, Hayley Atwell, Ving Rhames',
        posterUrl: '/posters/mission-impossible.jpg',
        releaseDate: new Date('2025-05-23'),
        rating: 'UA',
        isActive: true,
      },
    }),
    prisma.movie.create({
      data: {
        title: 'Interstellar',
        description: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
        duration: 169,
        language: 'English',
        genre: 'Sci-Fi, Adventure',
        director: 'Christopher Nolan',
        cast: 'Matthew McConaughey, Anne Hathaway, Jessica Chastain',
        posterUrl: '/posters/interstellar.jpg',
        releaseDate: new Date('2014-11-07'),
        rating: 'UA',
        isActive: true,
      },
    }),
    prisma.movie.create({
      data: {
        title: 'Inception',
        description: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
        duration: 148,
        language: 'English',
        genre: 'Sci-Fi, Action',
        director: 'Christopher Nolan',
        cast: 'Leonardo DiCaprio, Joseph Gordon-Levitt, Elliot Page',
        posterUrl: '/posters/inception.jpg',
        releaseDate: new Date('2010-07-16'),
        rating: 'UA',
        isActive: true,
      },
    }),
    prisma.movie.create({
      data: {
        title: 'The Dark Knight',
        description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
        duration: 152,
        language: 'English',
        genre: 'Action, Crime, Drama',
        director: 'Christopher Nolan',
        cast: 'Christian Bale, Heath Ledger, Aaron Eckhart',
        posterUrl: '/posters/dark-knight.jpg',
        releaseDate: new Date('2008-07-18'),
        rating: 'A',
        isActive: true,
      },
    }),
    prisma.movie.create({
      data: {
        title: 'Avatar: The Way of Water',
        description: 'Jake Sully lives with his newfound family formed on the extraterrestrial moon of Pandora. Once a familiar threat returns to finish what was previously started, Jake must work with Neytiri and the army of the Na\'vi race to protect their home.',
        duration: 192,
        language: 'English',
        genre: 'Action, Sci-Fi, Adventure',
        director: 'James Cameron',
        cast: 'Sam Worthington, Zoe Saldana, Sigourney Weaver',
        posterUrl: '/posters/avatar.jpg',
        releaseDate: new Date('2022-12-16'),
        rating: 'UA',
        isActive: true,
      },
    }),

    // Coming Soon (Upcoming - Released after 2026-06-29)
    prisma.movie.create({
      data: {
        title: 'Avengers: Secret Wars',
        description: 'The culminating chapter of the Multiverse Saga, bringing together heroes from across realities to face the ultimate threat.',
        duration: 180,
        language: 'English',
        genre: 'Action, Sci-Fi, Adventure',
        director: 'Russo Brothers',
        cast: 'Robert Downey Jr., Tom Holland, Benedict Cumberbatch',
        posterUrl: '/posters/secret-wars.jpg',
        releaseDate: new Date('2027-05-07'),
        rating: 'UA',
        isActive: true,
        interested: 12500,
      },
    }),
    prisma.movie.create({
      data: {
        title: 'Dune: Part Three',
        description: 'Paul Atreides\' journey continues as he consolidates power and battles the forces of the universe in this final chapter of the trilogy.',
        duration: 160,
        language: 'English',
        genre: 'Sci-Fi, Adventure',
        director: 'Denis Villeneuve',
        cast: 'Timothée Chalamet, Zendaya, Florence Pugh',
        posterUrl: '/posters/dune-3.jpg',
        releaseDate: new Date('2027-10-22'),
        rating: 'UA',
        isActive: true,
        interested: 9400,
      },
    }),
    prisma.movie.create({
      data: {
        title: 'Avatar 3',
        description: 'The journey continues into the deeper regions of Pandora, introducing new fire-based Na\'vi clans and challenging conflicts.',
        duration: 175,
        language: 'English',
        genre: 'Action, Sci-Fi, Adventure',
        director: 'James Cameron',
        cast: 'Sam Worthington, Zoe Saldana, Kate Winslet',
        posterUrl: '/posters/avatar-3.jpg',
        releaseDate: new Date('2026-12-18'),
        rating: 'UA',
        isActive: true,
        interested: 8600,
      },
    }),
    prisma.movie.create({
      data: {
        title: 'Spider-Man: Brand New Day',
        description: 'Peter Parker starts a fresh chapter in his life, balancing college struggles with street-level threats and new mysterious allies in NYC.',
        duration: 140,
        language: 'English',
        genre: 'Action, Sci-Fi, Adventure',
        director: 'Destin Daniel Cretton',
        cast: 'Tom Holland, Zendaya, Sydney Sweeney',
        posterUrl: '/posters/spider-man.jpg',
        releaseDate: new Date('2026-07-24'),
        rating: 'UA',
        isActive: true,
        interested: 15400,
      },
    }),
    prisma.movie.create({
      data: {
        title: 'The Batman Part II',
        description: 'Bruce Wayne descends deeper into the shadows of Gotham City, facing a new wave of crime and the aftermath of the city\'s flooding.',
        duration: 165,
        language: 'English',
        genre: 'Action, Crime, Drama',
        director: 'Matt Reeves',
        cast: 'Robert Pattinson, Zoë Kravitz, Colin Farrell',
        posterUrl: '/posters/batman-2.jpg',
        releaseDate: new Date('2026-10-02'),
        rating: 'A',
        isActive: true,
        interested: 7800,
      },
    }),
    prisma.movie.create({
      data: {
        title: 'Fantastic Four',
        description: 'Marvel\'s first family is introduced as they navigate a retro-futuristic 1960s universe and defend it against Galactus.',
        duration: 135,
        language: 'English',
        genre: 'Action, Sci-Fi, Adventure',
        director: 'Matt Shakman',
        cast: 'Pedro Pascal, Vanessa Kirby, Joseph Quinn',
        posterUrl: '/posters/fantastic-four.jpg',
        releaseDate: new Date('2026-07-25'),
        rating: 'UA',
        isActive: true,
        interested: 6900,
      },
    }),
  ]);

  console.log('Seeding theatres, screens, and seats...');
  for (const city of cities) {
    const theatreNames = [`PVR Multiplex, ${city.name}`, `INOX Cinema, ${city.name}`];

    for (const name of theatreNames) {
      const theatre = await prisma.theatre.create({
        data: {
          name,
          address: `Mall Road, ${city.name}`,
          cityId: city.id,
        },
      });

      // Create 2 screens for each theatre
      const screens = await Promise.all([
        prisma.screen.create({ data: { name: 'Audi 1', theatreId: theatre.id } }),
        prisma.screen.create({ data: { name: 'Audi 2 (IMAX)', theatreId: theatre.id } }),
      ]);

      // Seed seats for each screen
      for (const screen of screens) {
        const seatsData = [];
        const rows = ['A', 'B', 'C', 'D'];
        const cols = 10; // 10 seats per row

        for (const row of rows) {
          let seatType: SeatType = SeatType.NORMAL;
          if (row === 'C') seatType = SeatType.PREMIUM;
          if (row === 'D') seatType = SeatType.VIP;

          for (let col = 1; col <= cols; col++) {
            seatsData.push({
              screenId: screen.id,
              rowName: row,
              seatNumber: col,
              type: seatType,
            });
          }
        }

        await prisma.seat.createMany({
          data: seatsData,
        });
      }
    }
  }

  console.log('Seeding shows...');
  const allScreens = await prisma.screen.findMany({
    include: { seats: true },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dates = [
    new Date(today),
    new Date(today.getTime() + 24 * 60 * 60 * 1000), // tomorrow
    new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000), // day after
  ];

  const times = [
    { startHour: 10, startMin: 0, duration: 150 },
    { startHour: 14, startMin: 30, duration: 150 },
    { startHour: 19, startMin: 0, duration: 180 },
  ];

  const releasedMovies = movies.filter((m) => new Date(m.releaseDate) <= today);

  // Distribute showtimes sequentially to guarantee shows for all showing movies in all screens
  let movieIndex = 0;
  for (const date of dates) {
    for (const screen of allScreens) {
      for (const time of times) {
        const movie = releasedMovies[movieIndex % releasedMovies.length];
        movieIndex++;

        const startTime = new Date(date);
        startTime.setHours(time.startHour, time.startMin, 0, 0);

        const endTime = new Date(startTime.getTime() + time.duration * 60 * 1000);

        const show = await prisma.show.create({
          data: {
            movieId: movie.id,
            screenId: screen.id,
            startTime,
            endTime,
            date,
            priceNormal: 150.00,
            pricePremium: 250.00,
            priceVip: 400.00,
          },
        });

        // Generate ShowSeats
        const showSeatsData = screen.seats.map((seat) => ({
          showId: show.id,
          seatId: seat.id,
          status: SeatStatus.AVAILABLE,
        }));

        await prisma.showSeat.createMany({
          data: showSeatsData,
        });
      }
    }
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

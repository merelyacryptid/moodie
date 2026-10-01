export interface DailyQuote {
  quote: string
  source: string
  tag?: string
}

export const GENTLE_QUOTES: DailyQuote[] = [
  {
    quote: "Always believe in yourself. Do this and no matter where you are, you will have nothing to fear.",
    source: "The Cat Returns",
    tag: "Studio Ghibli",
  },
  {
    quote: "We each need to find our own inspiration. Sometimes it’s not easy.",
    source: "Kiki’s Delivery Service",
    tag: "Studio Ghibli",
  },
  {
    quote: "My mama always said, life was like a box of chocolates. You never know what you're gonna get.",
    source: "Forrest Gump",
  },
  {
    quote: "Yesterday is history, tomorrow is a mystery, but today is a gift. That is why it is called the present.",
    source: "Master Oogway, Kung Fu Panda",
  },
  {
    quote: "Try laughing. Then whatever scares you will go away.",
    source: "My Neighbor Totoro",
    tag: "Studio Ghibli",
  },
  {
    quote: "It is only with the heart that one can see rightly; what is essential is invisible to the eye.",
    source: "Antoine de Saint-Exupéry, The Little Prince",
  },
  {
    quote: "You're braver than you believe, stronger than you seem, and smarter than you think.",
    source: "A.A. Milne, Winnie the Pooh",
  },
  {
    quote: "They say that the best blaze burns brightest when circumstances are at their worst.",
    source: "Howl’s Moving Castle",
    tag: "Studio Ghibli",
  },
  {
    quote: "If we're kind and polite, the world will be right.",
    source: "Paddington 2",
  },
  {
    quote: "Even the smallest person can change the course of the future.",
    source: "Galadriel, The Lord of the Rings",
  },
  {
    quote: "The flower that blooms in adversity is the most rare and beautiful of all.",
    source: "The Emperor, Mulan",
  },
  {
    quote: "Once you’ve met someone, you never really forget them. It just takes a while for your memories to return.",
    source: "Zeniba, Spirited Away",
    tag: "Studio Ghibli",
  },
  {
    quote: "No matter what anybody tells you, words and ideas can change the world.",
    source: "John Keating, Dead Poets Society",
  },
  {
    quote: "Adventure is out there!",
    source: "Ellie, Up",
  },
  {
    quote: "You cannot alter your destiny. However, you can rise to meet it.",
    source: "Hii-sama, Princess Mononoke",
    tag: "Studio Ghibli",
  },
  {
    quote: "Just keep swimming.",
    source: "Dory, Finding Nemo",
  },
  {
    quote: "There is always something left to love.",
    source: "Gabriel García Márquez",
  },
  {
    quote: "You must see with eyes unclouded by hate. See the good in that which is evil, and the evil in that which is good.",
    source: "Princess Mononoke",
    tag: "Studio Ghibli",
  },
  {
    quote: "The things that make me different are the things that make me, me.",
    source: "Piglet, Winnie the Pooh",
  },
  {
    quote: "It's no use going back to yesterday, because I was a different person then.",
    source: "Alice in Wonderland",
  },
]

// Pick a gentle quote based on the day of the year so each day has a consistent, fresh thought
export function getDailyQuote(date?: Date): DailyQuote {
  const d = date || new Date()
  const startOfYear = new Date(d.getFullYear(), 0, 1)
  const dayOfYear = Math.floor((d.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24))
  const index = Math.abs(dayOfYear) % GENTLE_QUOTES.length
  return GENTLE_QUOTES[index]
}

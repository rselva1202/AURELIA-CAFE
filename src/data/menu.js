export const menuData = {
  servesAlcohol: false, // Set to true to display beer options
  categories: [
    {
      id: 'breakfast-toasts',
      name: 'Breakfast & Toasts',
      description: 'Morning plates, golden buttered sourdough toasts, and wholesome bowls.',
      items: [
        {
          id: 'cheese-toast',
          name: 'Cheese Toast',
          price: 140,
          category: 'breakfast-toasts',
        },
        {
          id: 'french-toast',
          name: 'French Toast',
          price: 140,
          category: 'breakfast-toasts',
        },
        {
          id: 'cheese-tuna-toast',
          name: 'Cheese Tuna Toast',
          price: 160,
          category: 'breakfast-toasts',
        },
        {
          id: 'cheese-tomato-toast',
          name: 'Cheese Tomato Toast',
          price: 150,
          category: 'breakfast-toasts',
        },
        {
          id: 'mixed-fruit-muesli',
          name: 'Mixed Fruit Muesli, Curd & Honey',
          price: 200,
          category: 'breakfast-toasts',
        },
      ],
    },
    {
      id: 'popular-dishes',
      name: 'Popular dishes',
      description: 'House specialties and cliffside favorites cooked fresh to order.',
      items: [
        {
          id: 'fresh-grilled-fish',
          name: 'Fresh grilled fish',
          price: null, // "Ask us" - cannot be ordered online
          category: 'popular-dishes',
        },
        {
          id: 'prawns',
          name: 'Prawns',
          price: null,
          category: 'popular-dishes',
        },
        {
          id: 'calamari',
          name: 'Calamari',
          price: null,
          category: 'popular-dishes',
        },
        {
          id: 'onion-pakora',
          name: 'Onion pakora',
          price: null,
          category: 'popular-dishes',
        },
        {
          id: 'pizza',
          name: 'Pizza',
          price: null,
          category: 'popular-dishes',
        },
        {
          id: 'cheese-naan',
          name: 'Cheese naan',
          price: null,
          category: 'popular-dishes',
        },
      ],
    },
    {
      id: 'drinks',
      name: 'Drinks',
      description: 'Specialty roasts, chilled juices, and refreshing sips overlooking the waves.',
      items: [
        {
          id: 'fresh-fruit-juices',
          name: 'Fresh fruit juices',
          price: null,
          category: 'drinks',
        },
        {
          id: 'espresso',
          name: 'Espresso',
          price: null,
          category: 'drinks',
        },
        {
          id: 'cold-beer',
          name: 'Cold beer, served in proper beer mugs',
          price: null,
          alcoholOnly: true,
          category: 'alcohol', // categorized as alcohol for exclusion
        },
      ],
    },
  ],
  cuisines: ['Indian', 'Italian', 'Chinese', 'Steakhouse', 'Seafood'],
}

export interface BlogPost {
    id: string;
    title: string;
    excerpt: string;
    content: string;
    image: string;
    date: string;
    author: string;
    categories: string[];
  }
  
  export const blogPosts: BlogPost[] = [
    {
      id: "understanding-rudraksha-benefits",
      title: "Understanding the Spiritual and Health Benefits of Rudraksha",
      excerpt: "Explore the ancient wisdom behind Rudraksha beads and discover how they can enhance your spiritual practice and overall well-being.",
      content: `...`, // Keeping content unchanged for readability
      image: "https://images.unsplash.com/photo-1612443016610-00c5e0f7f1b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      date: "June 15, 2025",
      author: "Rajesh Sharma",
      categories: ["Spiritual Growth", "Health & Wellness"]
    },
    {
      id: "how-to-authenticate-rudraksha",
      title: "How to Authenticate Genuine Rudraksha Beads",
      excerpt: "Learn the key characteristics of authentic Rudraksha beads and how to identify counterfeits in the market.",
      content: `...`,
      image: "https://images.unsplash.com/photo-1611843467160-25afb8df1074?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      date: "May 28, 2025",
      author: "David Chen",
      categories: ["Education", "Buying Guide"]
    },
    {
      id: "rudraksha-meditation-practices",
      title: "Enhancing Your Meditation with Rudraksha: Practices and Techniques",
      excerpt: "Discover effective meditation techniques that incorporate Rudraksha beads to deepen your practice and spiritual connection.",
      content: `...`,
      image: "https://images.unsplash.com/photo-1599639668273-c57372603ede?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      date: "April 10, 2025",
      author: "Priya Patel",
      categories: ["Meditation", "Spiritual Growth"]
    },
    {
      id: "rudraksha-in-ayurveda",
      title: "Rudraksha in Ayurveda: Ancient Wisdom for Modern Wellness",
      excerpt: "Explore how Ayurvedic principles utilize Rudraksha beads for balancing doshas and promoting holistic health.",
      content: `...`,
      image: "https://images.unsplash.com/photo-1518607692857-bff9babd9d40?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      date: "March 22, 2025",
      author: "Priya Patel",
      categories: ["Ayurveda", "Health & Wellness"]
    },
    {
      id: "rudraksha-for-beginners",
      title: "Rudraksha for Beginners: Starting Your Spiritual Journey",
      excerpt: "A comprehensive guide for those new to Rudraksha beads, covering everything you need to know to begin your practice.",
      content: `...`,
      image: "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      date: "February 5, 2025",
      author: "Amit Verma",
      categories: ["Beginner Guide", "Spirituality"]
    }
  ];
  
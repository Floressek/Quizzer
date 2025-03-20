<h1 align="center" style="font-size: 32px;">Quizzium - AI-Powered Interactive Quiz Platform</h1>
<p align="center">
  Create and take quizzes on any topic, dynamically generated from text or PDF content using AI
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#usage">Usage</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#license">License</a>
</p>

## Features

### 📚 Multiple Quiz Sources
- **Topic-Based Quizzes:** Generate quizzes on any topic using AI
- **PDF-Based Quizzes:** Upload PDFs to automatically create quizzes from their content
- **Custom Quizzes:** Create your own quizzes manually

### 🧠 AI-Powered Question Generation
- Automatically generates high-quality questions based on the content
- Multiple difficulty levels: Easy, Medium, Hard
- Question types: Multiple Choice and Open-Ended

### 📊 Advanced Statistics & Analysis
- Detailed performance tracking and visual analytics
- Historical progress monitoring
- Identify strengths and weaknesses
- Personalized study recommendations

### 🎓 Learning Features
- Quiz explanations for each answer
- Study mode for reviewing content
- Timed quizzes to improve speed
- Bookmark difficult questions

### 🌐 User Experience
- Responsive design for all devices
- Dark/Light mode
- Intuitive interface
- Comprehensive dashboard

## Tech Stack

- **Frontend:** React, Next.js 13
- **UI Components:** shadcn/ui, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** Prisma, MySQL (PlanetScale)
- **Authentication:** NextAuth.js
- **AI Integration:** OpenAI API
- **PDF Processing:** pdf.js
- **Deployment:** Vercel/Fly.io

## Getting Started

### Prerequisites

- Node.js 16+ installed
- NPM or Yarn
- MySQL database or PlanetScale account
- OpenAI API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/quizzzy-pro.git
   cd quizzzy-pro
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   # Database
   DATABASE_URL="mysql://..."
   
   # NextAuth
   NEXTAUTH_SECRET="your-secret-here"
   NEXTAUTH_URL="http://localhost:3000"
   
   # OAuth
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   
   # OpenAI
   OPENAI_API_KEY="your-openai-api-key"
   
   # App
   API_URL="http://localhost:3000"
   ```

4. Initialize the database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Creating a Quiz from a Topic

1. Navigate to the "Create Quiz" page
2. Select "From Topic"
3. Enter your desired topic
4. Select question type (Multiple Choice or Open-Ended)
5. Choose difficulty level and number of questions
6. Click "Generate Quiz"

### Creating a Quiz from a PDF

1. Navigate to the "Create Quiz" page
2. Select "From PDF"
3. Upload your PDF document
4. Configure quiz settings
5. Click "Generate Quiz"

### Taking a Quiz

1. Answer questions one by one
2. View explanations for correct/incorrect answers
3. Complete the quiz to see your score and statistics
4. Review your results in detail on the Statistics page

### Using Study Mode

1. Go to your quiz history
2. Select a completed quiz
3. Click "Study Mode"
4. Use flashcards to review the content
5. Bookmark difficult questions for later review

## Deployment

### Deploy on Vercel

The easiest way to deploy the application is with [Vercel](https://vercel.com):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Fquizzzy-pro)

### Deploy with Docker

You can also deploy using Docker:

```bash
# Build the Docker image
docker build -t quizzzy-pro .

# Run the container
docker run -p 3000:3000 -e DATABASE_URL=your-database-url quizzzy-pro
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- [OpenAI](https://openai.com/) for the powerful language model
- [Next.js](https://nextjs.org/) for the React framework
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Prisma](https://www.prisma.io/) for the ORM
- [NextAuth.js](https://next-auth.js.org/) for authentication
- [pdf.js](https://mozilla.github.io/pdf.js/) for PDF parsing

---

<p align="center">
  Made with ❤️ by Our Team
</p>

import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase'; // Assuming your firebase config is exported from here

// --- Component Props ---
interface LeaderboardProps {
  quizId: string;
}

// --- Data Structure for a Leaderboard Entry ---
interface LeaderboardEntry {
  userId: string;
  rank: number;
  name: string;
  score: number;
}

// --- Data Structure for raw data from Firestore ---
interface FirestoreLeaderboardData {
    userId: string;
    name: string;
    score: number;
    // It might also include 'completedAt', but we don't need it for display
}


const QuizLeaderBoardTable: React.FC<LeaderboardProps> = ({ quizId }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quizTitle, setQuizTitle] = useState('');

  useEffect(() => {
    // Guard clause: only run if a quizId is provided.
    if (!quizId) {
      setLoading(false);
      setError("No Quiz ID was provided.");
      return;
    }

    const fetchLeaderboard = async () => {
      setLoading(true);
      setError('');
      try {
        // 1. Create a reference to the specific quiz document.
        const quizDocRef = doc(db, "quizzes", quizId);

        // 2. Fetch the document.
        const docSnap = await getDoc(quizDocRef);

        if (!docSnap.exists()) {
          console.log('No such quiz document!');
          setError("Could not find the specified quiz.");
          setLeaderboard([]);
          return;
        }

        const quizData = docSnap.data();
        setQuizTitle(quizData.title || 'Quiz'); // Set quiz title

        // 3. Get the leaderboard array from the document data.
        // Provides a fallback to an empty array if the field doesn't exist.
        const results: FirestoreLeaderboardData[] = quizData.leaderboard || [];

        if (results.length === 0) {
            console.log('Leaderboard is empty for this quiz.');
            setLeaderboard([]);
            return;
        }

        // 4. Sort the array by score in descending order.
        // For ties, we can add a secondary sort, e.g., by name.
        results.sort((a, b) => {
          if (b.score !== a.score) {
            return b.score - a.score; // Higher score first
          }
          return a.name.localeCompare(b.name); // Alphabetical for ties
        });

        // 5. Add rank after sorting and map to the final display structure.
        const rankedResults: LeaderboardEntry[] = results.map((result, index) => ({
          userId: result.userId,
          name: result.name,
          score: result.score,
          rank: index + 1, // Rank is the index + 1
        }));

        console.log(rankedResults)

        // 6. Set the final state for rendering.
        setLeaderboard(rankedResults);

      } catch (err) {
        console.error("Error fetching quiz leaderboard:", err);
        setError("Failed to fetch the leaderboard. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();

  }, [quizId]); // Re-run effect if quizId changes


  if (loading) {
    return (
      <div className="flex justify-center items-center p-10">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-600 p-4 bg-red-50 rounded-lg">{error}</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
      <h2 className="text-2xl font-bold text-gray-800 text-center mb-1">Leaderboard</h2>
      {quizTitle && <p className="text-md text-gray-500 text-center mb-6">{quizTitle}</p>}

      <div className="overflow-x-auto">
        {leaderboard.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaderboard.map((entry) => (
                <tr key={entry.userId}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`flex items-center justify-center w-8 h-8 text-sm font-bold rounded-full ${
                        entry.rank === 1 ? 'bg-yellow-400 text-white' :
                        entry.rank === 2 ? 'bg-gray-300 text-gray-800' :
                        entry.rank === 3 ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700'
                      }`}>
                      {entry.rank}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{entry.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-700">
                    {entry.score}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-center text-gray-500 py-8">No scores have been recorded for this quiz yet.</p>
        )}
      </div>
    </div>
  );
};

export default QuizLeaderBoardTable;

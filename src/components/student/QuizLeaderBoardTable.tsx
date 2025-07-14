import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';


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

    const fetchAndFormatScores = async () => {
      setLoading(true);
      setError('');
      try {

        // UNCOMMENT THIS AFTER FIXING THE SCORE SAVING IN FIREBASE.
        // const resultsQuery = query(
        //   collection(db, "quizResults"),
        //   where("quizId", "==", quizId)
        // );
        // const querySnapshot = await getDocs(resultsQuery);

        // MOCK DATA for demonstration -- Comment this after actual firbase call
        const mockSnapshot = {
          empty: false,
          docs: [
            { data: () => ({ userId: 'user123', userName: 'Alice', quizDetails: { title: 'Algebra Basics' }, userAttempt: { score: 18 } }) },
            { data: () => ({ userId: 'user456', userName: 'Bob', quizDetails: { title: 'Algebra Basics' }, userAttempt: { score: 20 } }) },
            { data: () => ({ userId: 'user999', userName: 'Diana', quizDetails: { title: 'Algebra Basics' }, userAttempt: { score: 20 } }) },
            { data: () => ({ userId: 'user789', userName: 'Charlie', quizDetails: { title: 'Algebra Basics' }, userAttempt: { score: 15 } }) },
          ]
        };
        const querySnapshot = await Promise.resolve(mockSnapshot); // Simulating async call


        if (querySnapshot.empty) {
          console.log('No results found for this quiz.');
          setLeaderboard([]);
          return;
        }

        // Set quiz title from the first result
        const firstDocData = querySnapshot.docs[0].data();
        if (firstDocData.quizDetails && firstDocData.quizDetails.title) {
          setQuizTitle(firstDocData.quizDetails.title);
        }

        // 1. Map documents to a clean data structure
        const results = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            userId: data.userId,
            name: data.userName || 'Anonymous', // Fallback for safety
            score: data.userAttempt.score,
          };
        });

        // 2. Sort this array by score in descending order.
        results.sort((a, b) => {
          if (b.score !== a.score) {
            return b.score - a.score;
          }
          return a.name.localeCompare(b.name); // Optional: sort by name for ties
        });

        // 3. Add rank after sorting
        // THE FIX IS HERE: `resulr` has been corrected to `result`.
        const rankedResults: LeaderboardEntry[] = results.map((result, index) => ({
          ...result,
          rank: index + 1,
        }));

        // 4. Set the final state
        setLeaderboard(rankedResults);

      } catch (err) {
        console.error("Error fetching quiz scores:", err);
        setError("Failed to fetch scores. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchAndFormatScores();

  }, [quizId]);


  if (loading) {
    return (
      <div className="flex justify-center items-center p-10">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-600 p-4">{error}</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
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
                    <span className={`flex items-center justify-center w-8 h-8 text-sm font-bold rounded-full ${entry.rank === 1 ? 'bg-yellow-400 text-white' :
                        entry.rank === 2 ? 'bg-gray-300 text-gray-800' :
                          entry.rank === 3 ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700'
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
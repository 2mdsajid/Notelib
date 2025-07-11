import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  Info, 
  FileDown, 
  X,
  CheckCircle,
  TrendingUp,
  Users,
  BookOpen
} from 'lucide-react';

interface CollegeData {
  name: string;
  cutOff: {
    [key: string]: any;
  };
}

interface PredictionResult {
  college: string;
  program: string;
  category: string;
  chance: string;
  list: string;
  cutoff: string;
}

const IOEPredictor: React.FC = () => {
  const [rank, setRank] = useState<string>('');
  const [gender, setGender] = useState<string>('male');
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<PredictionResult[]>([]);
  const [collegesData, setCollegesData] = useState<CollegeData[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [allPrograms, setAllPrograms] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [expandedColleges, setExpandedColleges] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Color scheme for different chance levels
  const chanceColors = {
    'High Chance': 'bg-emerald-50 border-emerald-300 text-emerald-800',
    'Moderate Chance': 'bg-amber-50 border-amber-300 text-amber-800',
    'Low Chance': 'bg-orange-50 border-orange-300 text-orange-800',
    'Very Low Chance': 'bg-red-50 border-red-300 text-red-800'  };

  useEffect(() => {
    // Load data from the test-another-1 file
    const data = {
      colleges: [
        {
          name: "Pulchowk Campus",
          cutOff: {
            "Civil (Regular)": {
              "1st List": {
                "open": ["285"],
                "female": ["502"]
              },
              "2nd List": ["300"],
              "3rd List": ["303"],
              "4th List": ["307"],
              "Max Rank (5th-7th List)": ["314"]
            },
            "Civil (Full Fee)": {
              "1st List": {
                "open": ["664"],
                "female": ["718"]
              },
              "2nd List": {
                "open": ["707"],
                "female": ["780"]
              },
              "3rd List": ["749"],
              "4th List": ["775"],
              "Max Rank (5th-7th List)": ["1151"]
            },
            "Architecture (Regular)": {
              "1st List": ["848"],
              "2nd List": ["852"],
              "3rd List": ["860"],
              "4th List": [],
              "Max Rank (5th-7th List)": []
            },
            "Architecture (Full Fee)": {
              "1st List": ["1718"],
              "2nd List": ["1859"],
              "3rd List": ["1861"],
              "4th List": [],
              "Max Rank (5th-7th List)": ["1918"]
            },
            "Electrical (Regular)": {
              "1st List": ["518"],
              "2nd List": ["531"],
              "3rd List": ["535"],
              "4th List": ["557"],
              "Max Rank (5th-7th List)": []
            },
            "Electrical (Full Fee)": {
              "1st List": ["1379"],
              "2nd List": {
                "open": ["1643"],
                "female": ["1660"]
              },
              "3rd List": ["1871"],
              "4th List": ["2266"],
              "Max Rank (5th-7th List)": ["2429"]
            },
            "Electronics (BEI) - (Regular)": {
              "1st List": {
                "open": ["94"],
                "female": ["395"]
              },
              "2nd List": ["102"],
              "3rd List": ["110"],
              "4th List": {
                "open": ["378"],
                "female": ["867"]
              },
              "Max Rank (5th-7th List)": []
            },
            "Electronics (BEI) - (Full Fee)": {
              "1st List": {
                "open": ["410"],
                "female": ["772"]
              },
              "2nd List": {
                "open": ["441"],
                "female": ["819"]
              },
              "3rd List": {
                "open": ["530"],
                "female": ["884"]
              },
              "4th List": [],
              "Max Rank (5th-7th List)": {
                "open": ["421"],
                "female": ["884"]
              }
            },
            "Mechanical (Regular)": {
              "1st List": {
                "open": ["449"],
                "female": ["509"]
              },
              "2nd List": ["450"],
              "3rd List": ["524"],
              "4th List": ["1701"],
              "Max Rank (5th-7th List)": []
            },
            "Mechanical (Full Fee)": {
              "1st List": {
                "open": ["1049"],
                "female": ["1344"]
              },
              "2nd List": {
                "open": ["1189"],
                "female": ["1642"]
              },
              "3rd List": ["1309"],
              "4th List": ["1649"],
              "Max Rank (5th-7th List)": ["1784"]
            },
            "Computer (Regular)": {
              "1st List": {
                "open": ["34"],
                "female": ["62"]
              },
              "2nd List": [],
              "3rd List": [],
              "4th List": [],
              "Max Rank (5th-7th List)": []
            },
            "Computer (Full Fee)": {
              "1st List": {
                "open": ["174"],
                "female": ["214"]
              },
              "2nd List": {
                "open": ["204"],
                "female": ["370"]
              },
              "3rd List": {
                "open": ["206"],
                "female": ["386"]
              },
              "4th List": ["210"],
              "Max Rank (5th-7th List)": []
            },
            "Aerospace (Regular)": {
              "1st List": ["393"],
              "2nd List": [],
              "3rd List": ["444"],
              "4th List": ["449"],
              "Max Rank (5th-7th List)": ["323"]
            },
            "Aerospace (Full Fee)": {
              "1st List": ["1618"],
              "2nd List": ["1951"],
              "3rd List": ["2137"],
              "4th List": ["2385"],
              "Max Rank (5th-7th List)": []
            },
            "Chemical (Regular)": {
              "1st List": {
                "open": ["809"],
                "female": ["870"]
              },
              "2nd List": ["1242"],
              "3rd List": ["1277"],
              "4th List": ["857"],
              "Max Rank (5th-7th List)": []
            },
            "Chemical (Full Fee)": {
              "1st List": ["3028"],
              "2nd List": ["4111"],
              "3rd List": ["4563"],
              "4th List": ["4801"],
              "Max Rank (5th-7th List)": ["6402"]
            }
          }
        },
        {
          name: "Thapathali Campus",
          cutOff: {
            "Civil (Regular)": {
              "1st List": {
                "open": ["278"],
                "female": ["461"]
              },
              "2nd List": {
                "open": ["454"],
                "female": ["534"]
              },
              "3rd List": {
                "open": ["650"],
                "female": ["790"]
              },
              "4th List": ["797"],
              "Max Rank (5th-7th List)": ["680"]
            },
            "Civil (Full Fee)": {
              "1st List": ["1032"],
              "2nd List": ["1290"],
              "3rd List": ["1412"],
              "4th List": ["1461"],
              "Max Rank (5th-7th List)": ["1820"]
            },
            "Architecture (Regular)": {
              "1st List": ["860"],
              "2nd List": ["1852"],
              "3rd List": ["2112"],
              "4th List": ["1468"],
              "Max Rank (5th-7th List)": ["2017"]
            },
            "Architecture (Full Fee)": {
              "1st List": ["2262"],
              "2nd List": ["3117"],
              "3rd List": ["3735"],
              "4th List": ["3273"],
              "Max Rank (5th-7th List)": ["4182"]
            },
            "Electronics (BEI) - (Regular)": {
              "1st List": {
                "open": ["149"],
                "female": ["186"]
              },
              "2nd List": {
                "open": ["220"],
                "female": ["395"]
              },
              "3rd List": {
                "open": ["257"],
                "female": ["651"]
              },
              "4th List": ["255"],
              "Max Rank (5th-7th List)": []
            },
            "Electronics (BEI) - (Full Fee)": {
              "1st List": {
                "open": ["708"],
                "female": ["884"]
              },
              "2nd List": {
                "open": ["961"],
                "female": ["1077"]
              },
              "3rd List": {
                "open": ["1000"],
                "female": ["1095"]
              },
              "4th List": {
                "open": ["378"],
                "female": ["1169"]
              },
              "Max Rank (5th-7th List)": ["1195"]
            },
            "Mechanical (Regular)": {
              "1st List": ["480"],
              "2nd List": ["712"],
              "3rd List": ["1009"],
              "4th List": {
                "open": ["918"],
                "female": ["1389"]
              },
              "Max Rank (5th-7th List)": {
                "open": ["1122"],
                "female": ["2507"]
              }
            },
            "Mechanical (Full Fee)": {
              "1st List": {
                "open": ["1430"],
                "female": ["1673"]
              },
              "2nd List": {
                "open": ["1995"],
                "female": ["2139"]
              },
              "3rd List": ["2292"],
              "4th List": ["2952"],
              "Max Rank (5th-7th List)": ["4310"]
            },
            "Computer (Regular)": {
              "1st List": {
                "open": ["76"],
                "female": ["105"]
              },
              "2nd List": {
                "open": ["100"],
                "female": ["120"]
              },
              "3rd List": {
                "open": ["140"],
                "female": ["141"]
              },
              "4th List": ["147"],
              "Max Rank (5th-7th List)": []
            },
            "Computer (Full Fee)": {
              "1st List": {
                "open": ["266"],
                "female": []
              },
              "2nd List": {
                "open": ["362"],
                "female": []
              },
              "3rd List": {
                "open": ["397"],
                "female": []
              },
              "4th List": {
                "open": ["251"],
                "female": []
              },
              "Max Rank (5th-7th List)": ["378"]
            },
            "Automobile (Regular)": {
              "1st List": {
                "open": ["1084"],
                "female": []
              },
              "2nd List": ["1994"],
              "3rd List": ["2546"],
              "4th List": {
                "open": ["2662"],
                "female": []
              },
              "Max Rank (5th-7th List)": ["2813"]
            },
            "Automobile (Full Fee)": {
              "1st List": {
                "open": ["4478"],
                "female": []
              },
              "2nd List": {
                "open": ["5495"],
                "female": []
              },
              "3rd List": {
                "open": ["6348"],
                "female": []
              },
              "4th List": {
                "open": ["4953"],
                "female": []
              },
              "Max Rank (5th-7th List)": ["62563"]
            },
            "Industrial (Regular)": {
              "1st List": ["1540"],
              "2nd List": ["2015"],
              "3rd List": ["2605"],
              "4th List": ["4132"],
              "Max Rank (5th-7th List)": []
            },
            "Industrial (Full Fee)": {
              "1st List": ["5923"],
              "2nd List": ["6402"],
              "3rd List": [],
              "4th List": ["6179"],
              "Max Rank (5th-7th List)": ["4344"]
            }
          }
        },
        {
          name: "WRC Pokhara Campus",
          cutOff: {
            "Civil (Regular)": {
              "1st List": {
                "open": ["569"],
                "female": []
              },
              "2nd List": ["698"],
              "3rd List": {
                "open": ["749"],
                "female": []
              },
              "4th List": {
                "open": ["856"],
                "female": []
              },
              "Max Rank (5th-10th List)": ["911"]
            },
            "Civil (Full Fee)": {
              "1st List": ["1842"],
              "2nd List": ["2232"],
              "3rd List": ["2586"],
              "4th List": ["2698"],
              "Max Rank (5th-10th List)": ["3642"]
            },
            "Electrical (Regular)": {
              "1st List": {
                "open": ["991"],
                "female": []
              },
              "2nd List": ["1272"],
              "3rd List": ["1356"],
              "4th List": ["1435"],
              "Max Rank (5th-10th List)": ["1742"]
            },
            "Electrical (Full Fee)": {
              "1st List": ["3750"],
              "2nd List": ["5170"],
              "3rd List": ["6498"],
              "4th List": ["6447"],
              "Max Rank (5th-10th List)": ["5308"]
            },
            "Electronics (BEI) - (Regular)": {
              "1st List": ["423"],
              "2nd List": ["462"],
              "3rd List": ["516"],
              "4th List": ["378"],
              "Max Rank (5th-10th List)": ["953"]
            },
            "Electronics (BEI) - (Full Fee)": {
              "1st List": ["1824"],
              "2nd List": ["2284"],
              "3rd List": ["2436"],
              "4th List": ["1188"],
              "Max Rank (5th-10th List)": ["4035"]
            },
            "Mechanical (Regular)": {
              "1st List": ["1096"],
              "2nd List": {
                "open": ["1255"],
                "female": []
              },
              "3rd List": ["1538"],
              "4th List": ["1020"],
              "Max Rank (5th-10th List)": []
            },
            "Mechanical (Full Fee)": {
              "1st List": ["3550"],
              "2nd List": ["5304"],
              "3rd List": ["6440"],
              "4th List": ["6393"],
              "Max Rank (5th-10th List)": ["1831"]
            },
            "Computer (Regular)": {
              "1st List": {
                "open": ["114"],
                "female": []
              },
              "2nd List": ["140"],
              "3rd List": ["165"],
              "4th List": {
                "open": ["194"],
                "female": []
              },
              "Max Rank (5th-10th List)": ["207"]
            },
            "Computer (Full Fee)": {
              "1st List": {
                "open": ["590"],
                "female": []
              },
              "2nd List": {
                "open": ["688"],
                "female": []
              },
              "3rd List": {
                "open": ["753"],
                "female": []
              },
              "4th List": ["991"],
              "Max Rank (5th-10th List)": ["1491"]
            },
            "Geomatics (Regular)": {
              "1st List": ["1459"],
              "2nd List": ["1606"],
              "3rd List": ["1770"],
              "4th List": ["1130"],
              "Max Rank (5th-10th List)": ["1935"]
            },
            "Geomatics (Full Fee)": {
              "1st List": ["4192"],
              "2nd List": ["4914"],
              "3rd List": ["5091"],
              "4th List": ["3252"],
              "Max Rank (5th-10th List)": ["6442"]
            }
          }
        },
        {
          name: "ERC Dharan Campus",
          cutOff: {
            "Civil (Regular)": {
              "1st List": ["878"],
              "2nd List": ["941"],
              "3rd List": ["1008"],
              "4th List": ["922"],
              "Max Rank (5th-10th List)": ["1455"]
            },
            "Civil (Full Fee)": {
              "1st List": ["2833"],
              "2nd List": ["3454"],
              "3rd List": ["4006"],
              "4th List": ["3524"],
              "Max Rank (5th-10th List)": ["4391"]
            },
            "Electrical (Regular)": {
              "1st List": ["1277"],
              "2nd List": ["1553"],
              "3rd List": ["1890"],
              "4th List": ["1669"],
              "Max Rank (5th-10th List)": ["1983"]
            },
            "Electrical (Full Fee)": {
              "1st List": ["4532"],
              "2nd List": ["6404"],
              "3rd List": [],
              "4th List": ["6447"],
              "Max Rank (5th-10th List)": ["6065"]
            },
            "Electronics (BEI) - (Regular)": {
              "1st List": ["1156"],
              "2nd List": ["1255"],
              "3rd List": ["1388"],
              "4th List": [],
              "Max Rank (5th-10th List)": []
            },
            "Electronics (BEI) - (Full Fee)": {
              "1st List": ["3325"],
              "2nd List": ["5503"],
              "3rd List": ["6311"],
              "4th List": ["6439"],
              "Max Rank (5th-10th List)": ["6426"]
            },
            "Mechanical (Regular)": {
              "1st List": ["2508"],
              "2nd List": ["2234"],
              "3rd List": ["2481"],
              "4th List": {
                "open": ["2106"],
                "female": []
              },
              "Max Rank (5th-10th List)": ["2586"]
            },
            "Mechanical (Full Fee)": {
              "1st List": ["6418"],
              "2nd List": ["6490"],
              "3rd List": [],
              "4th List": ["5823"],
              "Max Rank (5th-10th List)": ["6353"]
            },
            "Computer (Regular)": {
              "1st List": {
                "open": ["375"],
                "female": []
              },
              "2nd List": ["437"],
              "3rd List": ["504"],
              "4th List": {
                "open": ["205"],
                "female": []
              },
              "Max Rank (5th-10th List)": {
                "open": ["562"],
                "female": []
              }
            },
            "Computer (Full Fee)": {
              "1st List": ["1664"],
              "2nd List": ["2103"],
              "3rd List": ["2367"],
              "4th List": ["1640"],
              "Max Rank (5th-10th List)": ["3256"]
            },
            "Architecture (Regular)": {
              "1st List": ["2525"],
              "2nd List": ["2733"],
              "3rd List": ["2771"],
              "4th List": [],
              "Max Rank (5th-10th List)": ["2525"]
            },
            "Architecture (Full Fee)": {
              "1st List": ["4779"],
              "2nd List": ["6473"],
              "3rd List": [],
              "4th List": ["6125"],
              "Max Rank (5th-10th List)": ["6473"]
            },
            "Agriculture (Regular)": {
              "1st List": ["3532"],
              "2nd List": ["3853"],
              "3rd List": ["4597"],
              "4th List": ["3042"],
              "Max Rank (5th-10th List)": ["4770"]
            },
            "Agriculture (Full Fee)": {
              "1st List": ["6245"],
              "2nd List": [],
              "3rd List": [],
              "4th List": ["5362"],
              "Max Rank (5th-10th List)": []
            }
          }
        },
        {
          name: "Chitwan Campus",
          cutOff: {
            "Architecture (Regular)": {
              "1st List": ["2224"],
              "2nd List": ["4213"],
              "3rd List": ["5021"],
              "4th List": [],
              "Max Rank (5th-7th List)": []
            },
            "Architecture (Full Fee)": {
              "1st List": ["6418"],
              "2nd List": [],
              "3rd List": [],
              "4th List": ["6094"],
              "Max Rank (5th-7th List)": []
            }
          }
        }
      ]
    };

    // Set colleges data safely
    setCollegesData(data.colleges as CollegeData[]);

    // Extract all program names
    const programsSet = new Set<string>();
    const collegesSet = new Set<string>();
    
    data.colleges.forEach(college => {
      collegesSet.add(college.name);
      Object.keys(college.cutOff).forEach(program => {
        programsSet.add(program);
      });
    });      setAllPrograms(Array.from(programsSet));
  }, []);
  // Automatic prediction when rank or gender changes
  useEffect(() => {
    if (rank && !isNaN(Number(rank)) && Number(rank) > 0 && collegesData.length > 0) {
      // Add a small delay to avoid too many rapid calls while typing
      const timeoutId = setTimeout(() => {
        handlePredict(false); // Don't show error toast for automatic predictions
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [rank, gender, selectedPrograms, collegesData]);

  const getProgramCategory = (program: string) => {
    if (program.includes("Regular")) return "Regular";
    if (program.includes("Full Fee")) return "Full Fee";
    return "Other";
  };

  const getProgramName = (program: string) => {
    return program.split('(')[0].trim();
  };

  const handleProgramToggle = (program: string) => {
    if (selectedPrograms.includes(program)) {
      setSelectedPrograms(selectedPrograms.filter(p => p !== program));
    } else {
      setSelectedPrograms([...selectedPrograms, program]);
    }
  };
  const calculateChance = (rankNum: number, cutoffNum: number, list: string): string => {
    // Calculate the difference between cutoff and your rank
    const difference = cutoffNum - rankNum;
    
    // Different logic based on which list we're looking at
    if (list.includes("1st")) {
      // For first list, be more conservative since competition is high
      if (difference >= 100) return 'High Chance';
      if (difference >= 30) return 'Moderate Chance';
      if (difference >= 0) return 'Low Chance';
      return 'Very Low Chance';
    } 
    else if (list.includes("Max Rank")) {
      // For Max Rank (typically last lists), be more optimistic
      if (difference >= 20) return 'High Chance';
      if (difference >= 5) return 'Moderate Chance';
      if (difference >= -10) return 'Low Chance';  // Even slightly below could have a chance
      return 'Very Low Chance';
    }
    else {
      // For middle lists (2nd, 3rd, 4th)
      if (difference >= 50) return 'High Chance';
      if (difference >= 15) return 'Moderate Chance';
      if (difference >= -5) return 'Low Chance';  // Even slightly below could have a chance
      return 'Very Low Chance';
    }
  };
  const handlePredict = (showErrorToast = true) => {
    if (!rank || isNaN(Number(rank)) || Number(rank) <= 0) {
      if (showErrorToast) {
        toast.error('Please enter a valid rank');
      }
      return;
    }

    setLoading(true);
    
    setTimeout(() => {
      const rankNum = parseInt(rank);
      const predictions: PredictionResult[] = [];

      collegesData.forEach(college => {
        Object.entries(college.cutOff).forEach(([program, lists]) => {
          // If programs are selected, only show selected programs
          if (selectedPrograms.length > 0 && !selectedPrograms.includes(program)) {
            return;
          }
          
          Object.entries(lists).forEach(([list, cutoffs]) => {
            let relevantCutoff = '';
              // Handle different cutoff data structures
            if (Array.isArray(cutoffs)) {
              // Simple array format
              if (cutoffs.length > 0) {
                relevantCutoff = cutoffs[0];
              }
            } else if (cutoffs && typeof cutoffs === 'object' && !Array.isArray(cutoffs)) {
              // Object with gender separation
              const genderCutoffs = cutoffs as { open?: string[]; female?: string[]; };
              if (gender === 'female' && genderCutoffs.female && genderCutoffs.female.length > 0) {
                relevantCutoff = genderCutoffs.female[0];
              } else if (genderCutoffs.open && genderCutoffs.open.length > 0) {
                relevantCutoff = genderCutoffs.open[0];
              }
            }
            
            if (relevantCutoff) {
              const cutoffNum = parseInt(relevantCutoff);
              if (!isNaN(cutoffNum)) {
                const chance = calculateChance(rankNum, cutoffNum, list);
                
                predictions.push({
                  college: college.name,
                  program,
                  category: getProgramCategory(program),
                  list,
                  cutoff: relevantCutoff,
                  chance
                });
              }
            }
          });
        });
      });
      
      // Sort by chance (better chances first)
      const sortedPredictions = predictions.sort((a, b) => {
        const chanceOrder = ['High Chance', 'Moderate Chance', 'Low Chance', 'Very Low Chance'];
        return chanceOrder.indexOf(a.chance) - chanceOrder.indexOf(b.chance);
      });
      
      setResults(sortedPredictions);
      setLoading(false);
    }, 1000); // Simulate loading time
  };  // Function to export data to PDF
  const exportToPDF = () => {
    if (results.length === 0) {
      toast.error("No results to export");
      return;
    }

    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.setTextColor(40, 116, 240);
      doc.text('IOE Admission Predictor Results', 20, 20);
      
      // Add user info
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Rank: ${rank}`, 20, 35);
      doc.text(`Gender: ${gender === 'male' ? 'Male' : 'Female'}`, 20, 45);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 55);
      
      // Prepare table data
      const tableData = results.map(result => [
        result.college,
        getProgramName(result.program),
        getProgramCategory(result.program),
        result.list,
        result.cutoff,
        result.chance
      ]);
        // Add table
      autoTable(doc, {
        head: [['College', 'Program', 'Category', 'List', 'Cutoff Rank', 'Admission Chance']],
        body: tableData,
        startY: 65,
        theme: 'grid',
        headStyles: {
          fillColor: [40, 116, 240],
          textColor: 255,
          fontSize: 10,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 9,
          textColor: 50
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        columnStyles: {
          0: { cellWidth: 30 }, // College
          1: { cellWidth: 25 }, // Program
          2: { cellWidth: 20 }, // Category
          3: { cellWidth: 20 }, // List
          4: { cellWidth: 20 }, // Cutoff
          5: { cellWidth: 25 }  // Chance
        },
        margin: { top: 65, left: 10, right: 10 },
        didDrawCell: (data: any) => {
          // Color code the chance column
          if (data.column.index === 5 && data.section === 'body') {
            const chance = data.cell.text[0];
            let color;
            switch (chance) {
              case 'High Chance':
                color = [34, 197, 94]; // Green
                break;
              case 'Moderate Chance':
                color = [245, 158, 11]; // Yellow
                break;
              case 'Low Chance':
                color = [249, 115, 22]; // Orange
                break;
              case 'Very Low Chance':
                color = [239, 68, 68]; // Red
                break;
              default:
                color = [107, 114, 128]; // Gray
            }            doc.setTextColor(color[0], color[1], color[2]);
          }
        }
      });
      
      // Add footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(
          `Page ${i} of ${pageCount} - IOE Admission Predictor 2025`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }
      
      // Save the PDF
      doc.save(`ioe-predictions-rank-${rank}.pdf`);
      toast.success("PDF file downloaded successfully");
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };
  // Group results by college for better visualization
  const resultsByCollege = useMemo(() => {
    const grouped: {[key: string]: PredictionResult[]} = {};
    results.forEach(result => {
      if (!grouped[result.college]) {
        grouped[result.college] = [];
      }
      grouped[result.college].push(result);    });
    return grouped;
  }, [results]);

  // Filtered results based on search term
  const filteredResultsByCollege = useMemo(() => {
    if (!searchTerm.trim()) return resultsByCollege;
    
    const filtered: {[key: string]: PredictionResult[]} = {};
    Object.entries(resultsByCollege).forEach(([college, collegeResults]) => {
      const filteredCollegeResults = collegeResults.filter(result => 
        college.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getProgramName(result.program).toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.program.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.chance.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (filteredCollegeResults.length > 0) {
        filtered[college] = filteredCollegeResults;
      }
    });
    return filtered;
  }, [resultsByCollege, searchTerm]);
  
  const toggleCollege = (college: string) => {
    if (expandedColleges.includes(college)) {
      setExpandedColleges(expandedColleges.filter(c => c !== college));
    } else {
      setExpandedColleges([...expandedColleges, college]);
    }
  };
  
  // Group programs by category
  const programsByCategory = useMemo(() => {
    const grouped: {[key: string]: string[]} = {
      "Regular": [],
      "Full Fee": []
    };
    
    allPrograms.forEach(program => {
      const category = getProgramCategory(program);
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(program);
    });
    
    return grouped;
  }, [allPrograms]);

  const handleSelectAllProgramsInCategory = (category: string) => {
    const programsInCategory = programsByCategory[category] || [];
    
    // Check if all programs in this category are already selected
    const allSelected = programsInCategory.every(program => 
      selectedPrograms.includes(program)
    );
    
    if (allSelected) {
      // Deselect all programs in this category
      setSelectedPrograms(
        selectedPrograms.filter(p => !programsInCategory.includes(p))
      );
    } else {
      // Select all programs in this category
      const newSelectedPrograms = [
        ...selectedPrograms.filter(p => !programsInCategory.includes(p)),
        ...programsInCategory
      ];
      setSelectedPrograms(newSelectedPrograms);
    }
  };
  
  // Count results by chance level
  const resultsByChance = useMemo(() => {
    const counts: {[key: string]: number} = {};
    Object.keys(chanceColors).forEach(chance => {
      counts[chance] = results.filter(r => r.chance === chance).length;
    });
    return counts;
  }, [results]);  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-4">

          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            IOE Admission Predictor 2025
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get accurate predictions for your IOE college admission chances based on historical data and your entrance exam rank
          </p>
        </motion.div>

        {/* Input Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Rank Input */}
            <div className="lg:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <BookOpen className="h-4 w-4 mr-2 text-blue-500" />
                Your IOE Rank
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={rank}
                  onChange={(e) => setRank(e.target.value)}
                  placeholder="Enter your rank (e.g. 150)"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 text-lg font-medium"
                />
                {rank && !isNaN(Number(rank)) && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                )}
              </div>
            </div>

            {/* Gender Selection */}
            <div className="lg:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <Users className="h-4 w-4 mr-2 text-blue-500" />
                Gender Category
              </label>
              <div className="flex space-x-3">
                <label className="flex-1">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={gender === 'male'}
                    onChange={() => setGender('male')}
                    className="sr-only"
                  />
                  <div className={`px-4 py-3 rounded-xl border-2 text-center cursor-pointer transition-all duration-200 ${
                    gender === 'male' 
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold' 
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}>
                    Male
                  </div>
                </label>
                <label className="flex-1">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={gender === 'female'}
                    onChange={() => setGender('female')}
                    className="sr-only"
                  />
                  <div className={`px-4 py-3 rounded-xl border-2 text-center cursor-pointer transition-all duration-200 ${
                    gender === 'female' 
                      ? 'border-pink-500 bg-pink-50 text-pink-700 font-semibold' 
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}>
                    Female
                  </div>
                </label>
              </div>
            </div>

            {/* Filter Toggle */}
            <div className="lg:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <Filter className="h-4 w-4 mr-2 text-blue-500" />
                Program Filters
              </label>
              <button 
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 flex items-center justify-center space-x-2 ${
                  showAdvancedFilters
                    ? 'border-purple-500 bg-purple-50 text-purple-700 font-semibold'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{showAdvancedFilters ? 'Hide Filters' : 'Show Filters'}</span>
                {showAdvancedFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>

            {/* Predict Button */}
            <div className="lg:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-3 opacity-0">
                Action
              </label>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePredict(true)}
                disabled={loading || !rank}
                className={`w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg ${
                  loading || !rank
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-200'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Analyzing...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Predict Chances</span>
                  </div>
                )}
              </motion.button>
            </div>
          </div>

          {/* Advanced Filters */}
          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-8 pt-8 border-t border-gray-200"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Program Categories */}
                  {Object.entries(programsByCategory).map((category) => (
                    <div key={category[0]} className="bg-gray-50 rounded-xl p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-gray-800 flex items-center">
                          <div className={`h-3 w-3 rounded-full mr-2 ${
                            category[0] === 'Regular' ? 'bg-green-500' : 'bg-blue-500'
                          }`}></div>
                          {category[0]} Programs ({category[1].length})
                        </h3>
                        <button 
                          onClick={() => handleSelectAllProgramsInCategory(category[0])}
                          className="text-xs px-3 py-1 rounded-full bg-white border border-gray-300 hover:bg-gray-100 transition-colors"
                        >
                          {category[1].every(program => selectedPrograms.includes(program)) ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                        {category[1].map((program) => (
                          <motion.label
                            key={program}
                            whileHover={{ scale: 1.02 }}
                            className="cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedPrograms.includes(program)}
                              onChange={() => handleProgramToggle(program)}
                              className="sr-only"
                            />
                            <div className={`px-3 py-2 rounded-lg border transition-all duration-200 text-sm ${
                              selectedPrograms.includes(program)
                                ? 'border-blue-300 bg-blue-50 text-blue-800 font-medium'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                            }`}>
                              <div className="flex items-center justify-between">
                                <span>{getProgramName(program)}</span>
                                {selectedPrograms.includes(program) && (
                                  <CheckCircle className="h-4 w-4 text-blue-500" />
                                )}
                              </div>
                            </div>
                          </motion.label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                {selectedPrograms.length > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-800">
                        {selectedPrograms.length} program(s) selected for filtering
                      </span>
                      <button
                        onClick={() => setSelectedPrograms([])}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                      >
                        <X className="h-4 w-4" />
                        <span>Clear all</span>
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

      {results.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Your Admission Chances</h2>
              <div className="flex space-x-2">                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={exportToPDF}
                  className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 shadow-sm"
                >
                  <FileDown size={16} className="mr-1" />
                  Export to PDF
                </motion.button>
              </div>
            </div>
            
            {/* Chance distribution */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {Object.entries(resultsByChance).map(([chance, count]) => (
                count > 0 ? (
                  <motion.div 
                    key={chance}
                    whileHover={{ y: -3 }}
                    onClick={() => setActiveTab(count > 0 ? chance : activeTab)}
                    className={`rounded-lg border p-3 cursor-pointer shadow-sm transition-all 
                      ${chanceColors[chance as keyof typeof chanceColors]}
                      ${activeTab === chance ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
                    `}
                  >
                    <h3 className="font-semibold text-center">{chance}</h3>
                    <p className="text-2xl font-bold text-center">{count}</p>
                    <p className="text-xs text-center">{count === 1 ? 'program' : 'programs'}</p>
                  </motion.div>
                ) : null
              ))}
              <motion.div 
                whileHover={{ y: -3 }}
                onClick={() => setActiveTab('all')}
                className={`rounded-lg border p-3 cursor-pointer shadow-sm bg-gray-50 border-gray-300 
                  ${activeTab === 'all' ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
                `}
              >
                <h3 className="font-semibold text-center text-gray-800">All Results</h3>
                <p className="text-2xl font-bold text-center text-gray-800">{results.length}</p>
                <p className="text-xs text-center text-gray-600">{results.length === 1 ? 'program' : 'programs'}</p>
              </motion.div>            </div>
            
            {/* Search input */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by college, program, category, or chance level..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            </div>
            
            {/* Results display - by college grouping */}
            <div className="space-y-4">
              {Object.entries(filteredResultsByCollege).map(([college, collegeResults]) => {
                // Filter by active tab
                const filteredCollegeResults = activeTab === 'all' 
                  ? collegeResults 
                  : collegeResults.filter(result => result.chance === activeTab);
                  
                if (filteredCollegeResults.length === 0) return null;
                
                const isExpanded = expandedColleges.includes(college);
                
                return (
                  <motion.div 
                    key={college}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border border-gray-200 rounded-lg overflow-hidden shadow-sm"
                  >
                    <div 
                      onClick={() => toggleCollege(college)}
                      className="bg-gray-50 px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-gray-100"
                    >
                      <h3 className="font-medium text-gray-800">{college}</h3>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 mr-2">
                          {filteredCollegeResults.length} {filteredCollegeResults.length === 1 ? 'program' : 'programs'}
                        </span>
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">List</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cutoff</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chance</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {filteredCollegeResults.map((result, index) => (
                              <motion.tr 
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                className="hover:bg-gray-50"
                              >
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{getProgramName(result.program)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{getProgramCategory(result.program)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{result.list}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                  <div className="flex items-center">
                                    <span>{result.cutoff}</span>
                                    {parseInt(rank) <= parseInt(result.cutoff) && (
                                      <span className="ml-2 text-green-600 text-xs font-medium">
                                        (Your rank: {rank})
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${chanceColors[result.chance as keyof typeof chanceColors]}`}>
                                    {result.chance}
                                  </span>
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200 text-sm text-gray-700">
              <div className="flex items-start">
                <Info size={20} className="text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="mb-2"><strong>How to interpret the results:</strong></p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><span className="font-medium text-green-700">High Chance</span>: Your rank is significantly better than the historical cutoff.</li>
                    <li><span className="font-medium text-yellow-700">Moderate Chance</span>: Your rank is better than the cutoff but within a competitive range.</li>
                    <li><span className="font-medium text-orange-700">Low Chance</span>: Your rank is just meeting the cutoff threshold.</li>
                    <li><span className="font-medium text-red-700">Very Low Chance</span>: Your rank is below the historical cutoff.</li>
                  </ul>
                  <p className="mt-2">Note: This prediction is based on historical data and should be used only as a reference. The actual admission process may vary.</p>
                </div>
              </div>            </div>
          </div>
        </motion.div>
      )}
      </div>
    </div>
  );
};

export default IOEPredictor;

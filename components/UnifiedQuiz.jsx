import React, { useState, useEffect } from 'react';
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Label } from "../components/ui/label";
import questions from "@/data/questions_database.json";

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

function UnifiedQuiz() {
  const [questionSet, setQuestionSet] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [showAnswersMap, setShowAnswersMap] = useState({});
  const [highlightCorrect, setHighlightCorrect] = useState(true);
  const [jumpTo, setJumpTo] = useState('');

  useEffect(() => {
    setQuestionSet(shuffle([...questions]));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'ArrowLeft') goToPrevious();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, questionSet]);

  const currentQuestion = questionSet[currentIndex];
  const userAnswer = responses[currentQuestion?.id] || (currentQuestion?.type === 'multiple' ? [] : '');
  const showAnswers = showAnswersMap[currentIndex];

  const handleChange = (qid, value, isMultiple) => {
    setResponses((prev) => {
      if (isMultiple) {
        const current = prev[qid] || [];
        return {
          ...prev,
          [qid]: current.includes(value)
            ? current.filter((v) => v !== value)
            : [...current, value],
        };
      }
      return { ...prev, [qid]: value === prev[qid] ? "" : value };
    });
  };

  const isCorrect = (question, userAnswer) => {
    if (question.type === 'match') {
      const correctAnswers = question.pairs.map(p => p.definition);
      return (
        Array.isArray(userAnswer) &&
        userAnswer.length === correctAnswers.length &&
        correctAnswers.every((val, idx) => userAnswer[idx] === val)
      );
    }
    const correct = question.choices?.filter((c) => c.correct).map((c) => c.text);
    if (question.type === 'single') return correct[0] === userAnswer;
    return (
      Array.isArray(userAnswer) &&
      userAnswer.length === correct.length &&
      correct.every((val) => userAnswer.includes(val))
    );
  };

  const renderChoices = (q) => (
    <div className="space-y-2">
      {q.choices.map((choice, i) => (
        <Label key={i} className="block">
          <input
            type={q.type === 'single' ? 'radio' : 'checkbox'}
            name={`q-${currentIndex}`}
            value={choice.text}
            checked={q.type === 'single'
              ? userAnswer === choice.text
              : userAnswer.includes && userAnswer.includes(choice.text)}
            onChange={() => handleChange(q.id, choice.text, q.type === 'multiple')}
            className="mr-2"
          />
          {choice.text}
        </Label>
      ))}
    </div>
  );

  const renderMatch = (q) => {
    const terms = q.pairs.map(p => p.term);
    const definitions = q.pairs.map(p => p.definition);
    const selections = responses[q.id] || [];

    return (
      <div className="space-y-4">
        {terms.map((term, i) => {
          const correctDef = q.pairs.find(p => p.term === term).definition;
          const selected = selections[i] || "";
          return (
            <div key={i} className="flex flex-col">
              <Label className="font-semibold mb-1">{term}</Label>
              <select
                className="border rounded px-3 py-1"
                value={selected}
                onChange={(e) => {
                  const newMatch = [...selections];
                  newMatch[i] = e.target.value;
                  setResponses({ ...responses, [q.id]: newMatch });
                }}
              >
                <option value="">-- Select an option --</option>
                {definitions.map((opt, j) => (
                  <option key={j} value={opt}>{opt}</option>
                ))}
              </select>
              {showAnswers && (
                <span className="text-xs text-gray-500">Answer: {correctDef}</span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderQuestion = (q) => {
    const correct = highlightCorrect && showAnswers && isCorrect(q, userAnswer);
    const answerClass = correct ? 'bg-green-100' : 'bg-red-100';

    return (
      <Card className={`mb-4 ${showAnswers ? answerClass : ''}`}>
        <CardContent className="p-4">
          <h2 className="text-xl font-semibold mb-4">{q.question}</h2>
          {q.img && (
            <img
              src={q.img}
              alt="Question related"
              className="mb-4 max-w-full h-auto border rounded"
            />
          )}
          {q.type === 'match' ? renderMatch(q) : renderChoices(q)}
          {showAnswers && q.choices && (
            <div className="mt-4 text-sm text-gray-700">
              Correct answer:
              <ul className="list-disc ml-6">
                {q.choices.filter(c => c.correct).map((c, i) => (
                  <li key={i}>{c.text}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const toggleAnswer = () => {
    setShowAnswersMap(prev => ({
      ...prev,
      [currentIndex]: !prev[currentIndex]
    }));
  };

  const goToPrevious = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const goToNext = () => {
    if (currentIndex < questionSet.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const handleJump = () => {
    const index = parseInt(jumpTo);
    if (!isNaN(index) && index >= 1 && index <= questionSet.length) {
      setCurrentIndex(index - 1);
    }
  };

  if (!currentQuestion) return <div>Loading...</div>;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto min-h-screen flex flex-col">
      <div className="flex-grow">
        <h1 className="text-2xl font-bold mb-4">Quiz</h1>
        <div className="text-sm text-gray-600 mb-2">
          Question {currentIndex + 1} of {questionSet.length}
        </div>
        {renderQuestion(currentQuestion)}
        <Card className="py-4 border-t mt-4 sticky bottom-0 bg-white z-10">
          <CardContent className="flex flex-col sm:flex-row gap-2 sm:gap-4 flex-wrap justify-center items-center">
            <Button onClick={toggleAnswer}>Show Answers</Button>
            <Button onClick={goToPrevious} disabled={currentIndex === 0}>Previous</Button>
            <Button onClick={goToNext} disabled={currentIndex === questionSet.length - 1}>Next</Button>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Jump to..."
                value={jumpTo}
                onChange={(e) => setJumpTo(e.target.value)}
                className="border px-2 py-1 rounded w-24"
              />
              <Button onClick={handleJump}>Go</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default UnifiedQuiz;
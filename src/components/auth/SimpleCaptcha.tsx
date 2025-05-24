
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SimpleCaptchaProps {
  onVerify: (isVerified: boolean) => void;
}

const SimpleCaptcha = ({ onVerify }: SimpleCaptchaProps) => {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    generateNewChallenge();
  }, []);

  const generateNewChallenge = () => {
    const newNum1 = Math.floor(Math.random() * 10) + 1;
    const newNum2 = Math.floor(Math.random() * 10) + 1;
    setNum1(newNum1);
    setNum2(newNum2);
    setUserAnswer("");
    setIsVerified(false);
    onVerify(false);
  };

  const handleAnswerChange = (value: string) => {
    setUserAnswer(value);
    const correctAnswer = num1 + num2;
    const isCorrect = parseInt(value) === correctAnswer;
    setIsVerified(isCorrect);
    onVerify(isCorrect);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="captcha">Security Check</Label>
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">
          What is {num1} + {num2}?
        </span>
        <Input
          id="captcha"
          type="number"
          value={userAnswer}
          onChange={(e) => handleAnswerChange(e.target.value)}
          className={`w-20 ${
            userAnswer && !isVerified ? 'border-red-500' : 
            isVerified ? 'border-green-500' : ''
          }`}
          placeholder="Answer"
        />
        {isVerified && (
          <span className="text-green-600 text-sm">✓ Verified</span>
        )}
        {userAnswer && !isVerified && (
          <span className="text-red-500 text-sm">✗ Incorrect</span>
        )}
      </div>
      <button
        type="button"
        onClick={generateNewChallenge}
        className="text-xs text-blue-600 hover:underline"
      >
        New challenge
      </button>
    </div>
  );
};

export default SimpleCaptcha;

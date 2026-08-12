
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState, Piece, Move, CheckersColor as Color } from '../types';

interface BoardProps {
  state: GameState;
  playerColor: Color | null;
  onMove: (move: Move) => void;
}

export const Board: React.FC<BoardProps> = ({ state, playerColor, onMove }) => {
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Move[]>([]);

  const { board, turn, status } = state;

  const isMyTurn = playerColor === turn && status === 'playing';

  useEffect(() => {
    if (!isMyTurn) {
      setSelectedPiece(null);
      setPossibleMoves([]);
    }
  }, [isMyTurn]);

  const getValidMoves = (piece: Piece): Move[] => {
    const moves: Move[] = [];
    const dirs = piece.isKing ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] : 
                 piece.color === 'w' ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];

    for (const [dr, dc] of dirs) {
      // Regular move
      const tr = piece.row + dr;
      const tc = piece.col + dc;
      if (tr >= 0 && tr < 8 && tc >= 0 && tc < 8 && !board[tr][tc]) {
        moves.push({ from: { row: piece.row, col: piece.col }, to: { row: tr, col: tc } });
      }

      // Jump move
      const jr = piece.row + dr * 2;
      const jc = piece.col + dc * 2;
      if (jr >= 0 && jr < 8 && jc >= 0 && jc < 8 && !board[jr][jc]) {
        const midR = piece.row + dr;
        const midC = piece.col + dc;
        const midPiece = board[midR][midC];
        if (midPiece && midPiece.color !== piece.color) {
          moves.push({ 
            from: { row: piece.row, col: piece.col }, 
            to: { row: jr, col: jc },
            captured: { row: midR, col: midC }
          });
        }
      }
    }
    return moves;
  };

  const handleSquareClick = (r: number, c: number) => {
    if (!isMyTurn) return;

    const targetPiece = board[r][c];
    
    // Select piece
    if (targetPiece && targetPiece.color === playerColor) {
      setSelectedPiece(targetPiece);
      setPossibleMoves(getValidMoves(targetPiece));
      return;
    }

    // Try to move
    if (selectedPiece) {
      const move = possibleMoves.find(m => m.to.row === r && m.to.col === c);
      if (move) {
        onMove(move);
        setSelectedPiece(null);
        setPossibleMoves([]);
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="relative bg-[#1a1c23] p-4 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-slate-700/50">
        <div className="grid grid-cols-8 grid-rows-8 w-[min(90vw,560px)] aspect-square border-4 border-slate-800">
          {Array.from({ length: 8 }).map((_, r) => (
            Array.from({ length: 8 }).map((_, c) => {
              const isDark = (r + c) % 2 === 1;
              const isSelected = selectedPiece?.row === r && selectedPiece?.col === c;
              const isPossibleTarget = possibleMoves.some(m => m.to.row === r && m.to.col === c);
              const piece = board[r][c];

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => handleSquareClick(r, c)}
                  className={`
                    relative flex items-center justify-center cursor-pointer transition-colors
                    ${isDark ? 'bg-[#16181d]' : 'bg-[#2d313a]'}
                    ${isPossibleTarget ? 'bg-indigo-500/20 ring-4 ring-indigo-500/30 ring-inset' : ''}
                  `}
                >
                  {/* Indicators */}
                  {isPossibleTarget && (
                    <div className="absolute w-4 h-4 rounded-full bg-indigo-400/60 shadow-[0_0_10px_rgba(79,70,229,0.5)]" />
                  )}
                  {isSelected && (
                    <div className="absolute inset-0 bg-indigo-400/20 border-2 border-indigo-400 z-10" />
                  )}

                  {/* Piece */}
                  <AnimatePresence>
                    {piece && (
                      <motion.div
                        layoutId={piece.id}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className={`
                          w-[80%] h-[80%] rounded-full shadow-lg flex items-center justify-center
                          ${piece.color === 'w' 
                            ? 'bg-gradient-to-br from-slate-200 to-slate-400 border border-white/20' 
                            : 'bg-gradient-to-br from-red-700 to-red-900 border border-red-500/30'
                          }
                          ${piece.isKing ? 'ring-4 ring-indigo-500/80 ring-offset-2 ring-offset-transparent' : ''}
                          relative z-20
                        `}
                      >
                        {piece.isKing && (
                          <div className={`text-xl ${piece.color === 'w' ? 'text-slate-600' : 'text-red-200'}`}>
                            👑
                          </div>
                        )}
                        
                        {/* Piece highlight */}
                        <div className="absolute top-1 left-2 w-1/2 h-1/4 bg-white/20 rounded-full blur-[2px]" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          ))}
        </div>
      </div>
    </div>
  );
};

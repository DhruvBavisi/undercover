import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { motion } from "framer-motion";

/**
 * @param {Object} props
 * @param {string} props.playerName
 * @param {string} props.playerAvatar
 * @param {Function} props.onContinue
 * @param {boolean} props.showAvatar
 */
export default function OfflinePassDevice({ playerName, playerAvatar, onContinue, showAvatar }) {
  return (
    <div className="container mx-auto px-4 flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md">
        <Card className="border-gray-700 bg-gray-800/40 shadow-lg backdrop-blur-sm text-center overflow-hidden">
          <CardHeader className="pb-6">
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="flex flex-col space-y-1.5 py-5"
            >
              <CardTitle className="text-2xl">Pass the device to</CardTitle>
            </motion.div>
          </CardHeader>
          <CardContent className="pb-6 flex flex-col items-center justify-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.2 
              }}
            >
              {showAvatar ? (
                <Avatar className="w-24 h-24 mb-6 border-4 border-gray-700 shadow-xl">
                  <AvatarImage src={playerAvatar} alt={playerName} />
                  <AvatarFallback className="bg-gray-700 text-2xl">{playerName.charAt(0)}</AvatarFallback>
                </Avatar>
              ) : (
                <div className="w-24 h-24 mb-6 flex items-center justify-center bg-gray-700 rounded-full border-4 border-gray-600 shadow-xl">
                  <span className="text-2xl font-bold">{playerName.charAt(0)}</span>
                </div>
              )}
            </motion.div>
            
            <motion.h2 
              className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              {playerName}
            </motion.h2>
          </CardContent>
          <CardFooter className="flex justify-center pt-2 pb-6">
            <motion.div
              className="w-full max-w-xs"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <Button
                size="lg"
                className="w-full text-lg py-6 transition-all hover:scale-105 active:scale-95 shadow-lg hover:shadow-primary/20"
                onClick={onContinue}
              >
                Reveal Word
              </Button>
            </motion.div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

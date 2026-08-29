import React from 'react';
import { motion } from 'framer-motion';

const BounceIn = ({ children, delay = 0 }) => {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
        delay: delay
      }}
    >
      {children}
    </motion.div>
  );
};

export default BounceIn;
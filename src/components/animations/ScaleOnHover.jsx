import React from 'react';
import { motion } from 'framer-motion';

const ScaleOnHover = ({ children, scale = 1.05 }) => {
  return (
    <motion.div
      whileHover={{
        scale: scale,
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
      }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
};

export default ScaleOnHover;
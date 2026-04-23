/**
 * This file serves as a bridge to the central API client.
 * Using a re-export allows us to keep the 'services' directory structure 
 * while centralizing logic in 'src/api/client.js'.
 */
export { default } from '../api/client';
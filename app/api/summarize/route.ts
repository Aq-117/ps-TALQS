import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory document store (would use a database in production)
// In a real implementation, this would be replaced with a database
const documentStore: Record<string, { content: string; fileName: string }> = {};

// Default document when no fingerprint is provided
let defaultDocument = {
  content: '',
  fileName: ''
};

// Helper functions based on the provided Python code
function cleanText(text: string): string {
  // "Preserve legal references, remove extra whitespace, and fix formatting."
  return text.trim().split(/\s+/).join(" ");
}

function chunkText(text: string, maxChunkLength: number = 1000): string[] {
  // Break text into logical chunks (simplified version)
  const sentences = text.split(". ");
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentLength = 0;

  for (const sentence of sentences) {
    const sentenceLength = sentence.split(/\s+/).length;
    
    if (currentLength + sentenceLength > maxChunkLength) {
      chunks.push(currentChunk.join(". ") + ".");
      currentChunk = [];
      currentLength = 0;
    }
    
    currentChunk.push(sentence);
    currentLength += sentenceLength;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(". ") + ".");
  }

  return chunks;
}

function summarizeChunks(chunks: string[]): string[] {
  // This is a simplified mock version of the BART model summarization
  // In a real implementation, you would use the actual model
  return chunks.map(chunk => {
    // Create a basic summary by taking the first sentence and a middle sentence
    const sentences = chunk.split(". ");
    if (sentences.length <= 2) return chunk;
    
    const firstSentence = sentences[0];
    const middleSentence = sentences[Math.floor(sentences.length / 2)];
    
    return `${firstSentence}. ${middleSentence}.`;
  });
}

function refineSummary(summary: string): string {
  // "Refine summary by removing redundant phrases and ensuring clarity."
  const unwantedPhrases = ["the following", "as follows", "in summary", "this means that"];
  let refinedSummary = summary;
  
  for (const phrase of unwantedPhrases) {
    refinedSummary = refinedSummary.replace(new RegExp(phrase, 'gi'), "");
  }
  
  return refinedSummary.trim();
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Check file type
    if (!file.name.endsWith('.txt')) {
      return NextResponse.json(
        { error: 'Only .txt files are supported' },
        { status: 400 }
      );
    }
    
    // Read the text content
    const fullText = await file.text();
    
    if (fullText.trim().length === 0) {
      return NextResponse.json(
        { error: 'The file is empty' },
        { status: 400 }
      );
    }
    
    // Get document fingerprint if provided
    const fingerprint = formData.get('fingerprint') as string | null;
    
    // Store the document content in memory for QA
    if (fingerprint) {
      documentStore[fingerprint] = {
        content: fullText,
        fileName: file.name
      };
    }
    
    // Also store as default document
    defaultDocument.content = fullText;
    defaultDocument.fileName = file.name;
    
    // Process the text using the functions from the provided Python code
    const cleanedText = cleanText(fullText);
    
    // Check if the text is too short
    if (cleanedText.split(/\s+/).length < 100) {
      return NextResponse.json(
        { error: 'Text is too short for meaningful summarization' },
        { status: 400 }
      );
    }
    
    // Generate chunks
    const chunks = chunkText(cleanedText);
    
    // Generate summaries for each chunk
    const summaries = summarizeChunks(chunks);
    
    // Refine and combine summaries
    const finalSummary = summaries.map(s => refineSummary(s)).join("\n\n");
    
    return NextResponse.json({
      fileName: file.name,
      fileSize: file.size,
      summary: `### Structured Legal Summary ###\n${finalSummary}`,
      originalTextPreview: cleanedText.substring(0, 300) + (cleanedText.length > 300 ? '...' : '')
    });
    
  } catch (error) {
    console.error('Error processing file:', error);
    return NextResponse.json(
      { error: 'Failed to process the file' },
      { status: 500 }
    );
  }
}

// Get the stored document (for internal use)
export function getStoredDocument(fingerprint?: string | null): { content: string; fileName: string } {
  if (fingerprint && documentStore[fingerprint]) {
    return documentStore[fingerprint];
  }
  return defaultDocument;
}

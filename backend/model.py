import torch
from transformers import LongT5ForConditionalGeneration, LongT5TokenizerFast

class LegalQAModel:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        # Initialize with pretrained model - this would be replaced with your fine-tuned model
        self.tokenizer = LongT5TokenizerFast.from_pretrained("google/long-t5-tglobal-base")
        self.model = LongT5ForConditionalGeneration.from_pretrained("google/long-t5-tglobal-base").to(self.device)
    
    def generate_answer(self, context, question, max_length=100):
        """
        Generate an answer to a question based on the provided context
        """
        input_text = f"question: {question} context: {context}"
        input_ids = self.tokenizer.encode(input_text, return_tensors="pt").to(self.device)
        
        # Generate sequence
        output_ids = self.model.generate(
            input_ids, 
            max_length=max_length, 
            num_beams=4,
            early_stopping=True
        )
        
        # Decode and return answer
        return self.tokenizer.decode(output_ids[0], skip_special_tokens=True)
    
    def summarize_text(self, text, max_length=200):
        """
        Generate a summary of the provided text
        """
        # Format for summarization
        input_text = f"summarize: {text}"
        input_ids = self.tokenizer.encode(input_text, return_tensors="pt").to(self.device)
        
        # Generate summary
        output_ids = self.model.generate(
            input_ids, 
            max_length=max_length, 
            num_beams=4,
            early_stopping=True
        )
        
        # Decode and return summary
        return self.tokenizer.decode(output_ids[0], skip_special_tokens=True)

# Note: To use this model, you would uncomment the code below and integrate it with app.py
# In a production environment, you would also fine-tune the model first using your training code

# Initialize model (this would happen at application startup)
# qa_model = LegalQAModel()

# Example usage:
# context = "Long legal document here..."
# question = "Who is the petitioner in the case?"
# answer = qa_model.generate_answer(context, question)
# print(answer)

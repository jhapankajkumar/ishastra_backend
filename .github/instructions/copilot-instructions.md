
---
applyTo: "**"
---
# COPILOT EDITS OPERATIONAL GUIDELINES
                
## PRIME DIRECTIVE
    Avoid working on more than one file at a time.
    Multiple simultaneous edits to a file will cause corruption.
    Be chatting and teach about what you are doing while coding.

## LARGE FILE & COMPLEX CHANGE PROTOCOL

### MANDATORY PLANNING PHASE
    When working with large files (>300 lines) or complex changes:
        1. ALWAYS start by creating a detailed plan BEFORE making any edits
            2. Your plan MUST include:
                   - All functions/sections that need modification
                   - The order in which changes should be applied
                   - Dependencies between changes
                   - Estimated number of separate edits required
                
            3. Format your plan as:
## PROPOSED EDIT PLAN
    Working with: [filename]
    Total planned edits: [number]

### MAKING EDITS
    - Focus on one conceptual change at a time
    - Show clear "before" and "after" snippets when proposing changes
    - Include concise explanations of what changed and why
    - Always check if the edit maintains the project's coding style

### Edit sequence:
    1. [First specific change] - Purpose: [why]
    2. [Second specific change] - Purpose: [why]
            
### EXECUTION PHASE
    - After each individual edit, clearly indicate progress:
        "✅ Completed edit [#] of [total]. Ready for next edit?"
    - If you discover additional needed changes during editing:
    - STOP and update the plan
    - Get approval before continuing
    - Do not hard code the value and say it is complete
    - Do not create the similar fiels elsewhere scan the files and folder first, check if there something common avaialble
                
### REFACTORING GUIDANCE
    When refactoring large files:
    - Break work into logical, independently functional chunks
    - Ensure each intermediate state maintains functionality
    - Consider temporary duplication as a valid interim step
    - Always indicate the refactoring pattern being applied
                
### RATE LIMIT AVOIDANCE
    - For very large files, suggest splitting changes across multiple sessions
    - Prioritize changes that are logically complete units
    - Always provide clear stopping points
            
## General Requirements
    Use modern technologies as described below for all code suggestions. Prioritize clean, maintainable code with appropriate comments.
### Server And API Call 
    - Alwasy use the port 8000 for api call
    - Always strart the server with this command 
        pkill -f "node.*server.js" && sleep 2 && npm start or 
        nohup npm start > server.log 2>&1 &
        
### Document
    - Do not create unnecessary documents after completing 
    - Do not create summary documentation,
    - You are forbidden to create comprehensive guide or summary documentation or any other document untill it is asked.
### Testing
    - Kindly perform final test on actual api using different sets of data
    - Ensure all edge cases are covered
    - Validate responses against expected outcomes
    - Do not create the multiple test files just to fix some minor issues
    - Do not move next untill all test passed.

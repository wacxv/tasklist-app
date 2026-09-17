# tasklist-app (.NET Task Evaluator API – Technical Exam)

⏰ **Estimated Time**: 2–3 hours  
🔧 **Tech Stack**:
- .NET 9 Web API  
- PostgreSQL  
- Entity Framework Core (EF Core)  
- Swagger for API documentation  

---

## 🧪 Technical Exam Instructions

### 1. Clone the repository

```bash
git clone https://github.com/phia-digiteer/dotnet-task-evaluator.git
cd dotnet-task-evaluator
```

---

2. Set up the environment
Make sure you have the .NET 9 SDK and PostgreSQL installed. Configure your local database connection string as needed.
3. Apply database migrations
Run the following command to create the database schema:

```bash
dotnet ef database update
```

### 🎯 Objectives

- Interact with a .NET 9 Web API in a realistic development environment  
- Notice gaps or inconsistencies within basic operations  
- Consider improvements around structure, access control, and maintainability  
- Apply practical architectural concepts to guide decisions  
- Enhance functionality where needed or where something feels off  
- Work with EF Core to interact with data cleanly  
- Optionally introduce supporting tests or clarifying documentation

### 📦 Commit Guidelines

Please commit frequently as you work. Avoid one big fat commit at the end.
Each commit should:

- Have a clear, descriptive message (e.g., Add TaskService)-Explain your reasoning if you're making assumptions or design choices
- Show incremental progress (yes, even small ones!)
- Your commit history helps us understand your thinking — don’t hide the struggle 💪
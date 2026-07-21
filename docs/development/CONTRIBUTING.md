# 🤝 Contributing to BLOTIC

Thank you for your interest in contributing to BLOTIC! This document provides guidelines and information for contributors.

## 📋 Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)

## 📜 Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

### Our Pledge
We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards
- **Be respectful** and inclusive in your language and actions
- **Be collaborative** and help others learn and grow
- **Be constructive** in your feedback and criticism
- **Focus on what's best** for the community and project

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or higher
- npm or yarn package manager
- Git for version control
- Basic knowledge of React, TypeScript, and Supabase

### Development Setup

1. **Fork the repository**
   ```bash
   # Click the "Fork" button on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/blotic-web-react.git
   cd blotic-web-react
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/blotic-web-react.git
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Set up environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

## 🔄 Making Changes

### Branch Naming Convention
- **Feature**: `feature/description-of-feature`
- **Bug Fix**: `fix/description-of-bug`
- **Documentation**: `docs/description-of-changes`
- **Refactor**: `refactor/description-of-refactor`

### Workflow

1. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, readable code
   - Follow existing code style
   - Add comments where necessary
   - Update documentation if needed

3. **Test your changes**
   ```bash
   npm run lint
   npm run type-check
   npm run build
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

### Commit Message Convention
We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

**Examples:**
```
feat: add user profile avatar upload functionality
fix: resolve event registration date parsing issue
docs: update installation instructions in README
style: format code according to prettier rules
refactor: simplify authentication context logic
```

## 🔍 Pull Request Process

### Before Submitting
- [ ] Code follows project style guidelines
- [ ] Self-review of code completed
- [ ] Comments added to hard-to-understand areas
- [ ] Documentation updated if necessary
- [ ] No merge conflicts with main branch
- [ ] All tests pass locally

### Submitting a Pull Request

1. **Push your branch**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request**
   - Go to GitHub and click "New Pull Request"
   - Choose your branch as the source
   - Fill out the PR template completely
   - Link any related issues

3. **PR Template**
   ```markdown
   ## Description
   Brief description of changes made

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Documentation update
   - [ ] Refactoring

   ## Testing
   - [ ] Tested locally
   - [ ] All existing tests pass
   - [ ] New tests added (if applicable)

   ## Screenshots (if applicable)
   Add screenshots to help explain your changes

   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Documentation updated
   - [ ] No breaking changes
   ```

### Review Process
- **Code Review**: At least one maintainer will review your PR
- **Feedback**: Address any requested changes promptly
- **Approval**: PR will be merged after approval and passing checks
- **Cleanup**: Delete your feature branch after merge

## 🎨 Coding Standards

### TypeScript
- Use **strict TypeScript** configuration
- Define **proper interfaces** for all data structures
- Avoid `any` type - use specific types
- Use **type guards** for runtime type checking

### React
- Use **functional components** with hooks
- Follow **React best practices** and patterns
- Use **proper prop types** and interfaces
- Implement **error boundaries** where appropriate

### Styling
- Use **Tailwind CSS** for styling
- Follow **responsive design** principles
- Use **shadcn/ui components** when possible
- Maintain **consistent spacing** and colors

### Code Organization
- Keep **components small** and focused
- Use **custom hooks** for reusable logic
- Organize **files logically** in appropriate directories
- Follow **import order** conventions

### Example Code Style
```typescript
// Good
interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'core' | 'member';
}

const UserCard: React.FC<{ user: UserProfile }> = ({ user }) => {
  const { hasPermission } = useRoleCheck();
  
  if (!hasPermission('viewUsers')) {
    return null;
  }

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold">{user.name}</h3>
      <p className="text-muted-foreground">{user.email}</p>
    </Card>
  );
};
```

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests
- Write **unit tests** for utility functions
- Write **integration tests** for components
- Use **React Testing Library** for component tests
- Mock **external dependencies** appropriately

### Test Example
```typescript
import { render, screen } from '@testing-library/react';
import { UserCard } from './UserCard';

describe('UserCard', () => {
  it('renders user information correctly', () => {
    const mockUser = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'member' as const
    };

    render(<UserCard user={mockUser} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });
});
```

## 📚 Documentation

### Code Documentation
- Add **JSDoc comments** for complex functions
- Document **component props** with TypeScript interfaces
- Include **usage examples** in component documentation
- Update **README.md** for significant changes

### API Documentation
- Document **new API endpoints** or changes
- Include **request/response examples**
- Update **Supabase schema** documentation
- Document **environment variables**

## 🐛 Bug Reports

When reporting bugs, please include:
- **Clear description** of the issue
- **Steps to reproduce** the problem
- **Expected vs actual behavior**
- **Screenshots** if applicable
- **Environment details** (OS, browser, Node version)
- **Console errors** or logs

## 💡 Feature Requests

When suggesting features:
- **Describe the problem** you're trying to solve
- **Explain your proposed solution**
- **Consider alternative solutions**
- **Discuss potential impact** on existing functionality

## 📞 Getting Help

- **GitHub Issues**: For bugs and feature requests
- **Email**: bloticbvducoep@gmail.com for general questions
- **Documentation**: Check existing docs and README first

## 🏆 Recognition

Contributors will be recognized in:
- **README.md** contributors section
- **Release notes** for significant contributions
- **Project documentation** where appropriate

## 📄 License

By contributing to BLOTIC, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to BLOTIC! 🚀**

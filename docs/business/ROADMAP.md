# Development Roadmap

## Version 1.0 - Core Archive (MVP)

**Focus:** Basic video archive functionality

### Features
- [ ] YouTube video embedding
- [ ] Video submission form with validation
- [ ] Browse videos by year
- [ ] Browse videos by act category
- [ ] Basic search (title, description)
- [ ] Responsive design

### Technical Requirements
- [ ] PostgreSQL database setup
- [ ] Prisma schema and migrations
- [ ] API routes for videos and acts
- [ ] YouTube URL parsing/validation

---

## Version 2.0 - Authentication

**Focus:** Alumni-only access

### Features
- [ ] Email-based invite system
- [ ] User registration/login
- [ ] Alumni verification workflow
- [ ] User profiles
- [ ] "My submissions" page

### Technical Requirements
- [ ] NextAuth.js integration
- [ ] User model in database
- [ ] Email service integration
- [ ] Protected routes

---

## Version 3.0 - Community Voting

**Focus:** Recognition and engagement

### Features
- [ ] Upvote/downvote videos
- [ ] "Best of [Year]" collections
- [ ] Leaderboards by act type
- [ ] Personal favorites list

### Technical Requirements
- [ ] Vote model in database
- [ ] Vote aggregation queries
- [ ] Rate limiting

---

## Version 4.0 - Community Features

**Focus:** Engagement and metadata

### Features
- [ ] Comments on videos
- [ ] Performer tagging
- [ ] User-generated tags
- [ ] Video flagging/reporting
- [ ] Notifications

### Technical Requirements
- [ ] Comment model
- [ ] Performer model
- [ ] Tag model
- [ ] Moderation tools

---

## Future Considerations

- Mobile app (React Native)
- Advanced analytics
- API for external integrations
- Bulk video import tools
- Archive export/backup

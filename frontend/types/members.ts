export interface MemberFiltersState {
  searchQuery: string
  verticals: string[] // Array of strings (e.g. ['Yuva', 'Thalir'])
  positions: string[] // Array of strings (e.g. ['Chair'])
  industries: string[] // Array of strings
  skills: string[] // Array of strings (from business_tags)
  hobbies: string[] // Array of strings (from hobby_tags)
}

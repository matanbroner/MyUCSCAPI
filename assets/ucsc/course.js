class Course {
  constructor(name, id, section, config) {
    this.name = name;
    this.id = id;
    this.section = section;
    this.config = config;
  }

  name() {
    return this.name;
  }
}

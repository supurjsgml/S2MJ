# S2MJ (Service to MyBatis Jump)

Spring Service Mapper method to MyBatis XML mapper configuration jumper for VS Code.

VS Code에서 Spring Java Mapper 메서드 호출/선언부와 MyBatis XML 매퍼 설정 사이의 상호 이동 및 참조 탐색을 지원하는 확장 프로그램입니다.

![S2MJ Demo](sample.gif)

---

## English

### Features
* **Jump to MyBatis XML (Java -> XML)**
  * Move from a Mapper method call or declaration in Java files to the corresponding query block (`<select>`, `<insert>`, etc.) in MyBatis XML.
  * **Shortcut:** `Alt + J`
  * **Context Menu:** Right-click on a Java code line and select `Jump to MyBatis XML (S2MJ)`.
* **Reverse Jump to Java (XML -> Java)**
  * Move from MyBatis XML to the corresponding Java Interface or method.
  * **Ctrl + Click (or F12)** on `namespace` value in `<mapper namespace="...">` to jump to the Java Mapper Interface.
  * **Ctrl + Click (or F12)** on `id` value in query tags (e.g. `<select id="selectUserById">`) to jump to the Java method declaration.
* **Find References (Java -> XML)**
  * Find MyBatis XML query locations from Java Mapper methods.
  * Press **Shift + F12** (or right-click and choose "Find All References") on a Mapper method to see the corresponding MyBatis XML query as a reference.

### Requirements
* Spring Java project structure.
* MyBatis XML mapper files in the workspace.

---

## 한국어 (Korean)

### 주요 기능
* **MyBatis XML로 이동 (Java -> XML)**
  * Java 파일의 Mapper 메서드 호출부나 선언부에서 대응하는 MyBatis XML의 쿼리 블록(`<select>`, `<insert>` 등)으로 바로 이동합니다.
  * **단축키:** `Alt + J`
  * **콘텍스트 메뉴:** Java 코드 영역 우클릭 후 `MyBatis XML로 이동 (S2MJ)` 선택.
* **Java 파일로 역방향 이동 (XML -> Java)**
  * MyBatis XML에서 대응하는 Java 인터페이스 또는 메서드로 바로 이동합니다.
  * `<mapper namespace="...">`의 `namespace` 값에서 **Ctrl + 클릭 (또는 F12)** 시 Java Mapper 인터페이스 파일로 이동합니다.
  * 쿼리 태그의 `id` 값(예: `<select id="selectUserById">`)에서 **Ctrl + 클릭 (또는 F12)** 시 Java 메서드 선언부로 이동합니다.
* **참조 찾기 (Java -> XML)**
  * Java Mapper 메서드에서 참조하는 MyBatis XML 쿼리의 위치를 찾습니다.
  * Mapper 메서드 이름 위에서 **Shift + F12**(모든 참조 찾기)를 누르면 MyBatis XML의 쿼리 태그가 참조 목록에 표시됩니다.

### 요구 사항
* Spring Java 프로젝트 구조.
* 작업 영역(Workspace) 내에 MyBatis XML 매퍼 파일이 존재해야 합니다.

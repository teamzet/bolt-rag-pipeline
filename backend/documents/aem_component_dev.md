# AEM Component Development Guide

## Overview
Adobe Experience Manager (AEM) component development involves creating reusable UI elements that content authors can use to build web pages. This guide covers the development process, best practices, and testing strategies.

## Component Structure

### Basic Component Structure
```
/apps/myproject/components/content/mycomponent/
├── .content.xml                 # Component definition
├── _cq_dialog.xml              # Author dialog
├── mycomponent.html            # HTL template
├── mycomponent.js              # Client-side JavaScript
├── clientlib/                  # Client libraries
│   ├── css/
│   │   └── mycomponent.css
│   ├── js/
│   │   └── mycomponent.js
│   └── .content.xml
└── README.md                   # Component documentation
```

### Component Definition (.content.xml)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:cq="http://www.day.com/jcr/cq/1.0" 
          xmlns:jcr="http://www.jcp.org/jcr/1.0"
    jcr:primaryType="cq:Component"
    jcr:title="My Component"
    jcr:description="A sample component for demonstration"
    componentGroup="My Project - Content"
    cq:isContainer="{Boolean}false"/>
```

## HTL (HTML Template Language)

### Basic HTL Syntax
```html
<div class="my-component" data-sly-use.model="com.myproject.models.MyComponentModel">
    <h2>${model.title @ context='html'}</h2>
    <p>${model.description @ context='html'}</p>
    
    <!-- Conditional rendering -->
    <div data-sly-test="${model.showImage}">
        <img src="${model.imageUrl}" alt="${model.imageAlt}" />
    </div>
    
    <!-- List rendering -->
    <ul data-sly-list.item="${model.items}">
        <li>${item.title}</li>
    </ul>
</div>
```

### HTL Best Practices
- Always use appropriate context for output (`@context='html'`, `@context='attribute'`)
- Use `data-sly-use` for Java models
- Implement proper null checks with `data-sly-test`
- Use semantic HTML elements
- Follow accessibility guidelines

## Sling Models

### Java Model Example
```java
@Model(adaptables = Resource.class, defaultInjectionStrategy = DefaultInjectionStrategy.OPTIONAL)
public class MyComponentModel {
    
    @ValueMapValue
    private String title;
    
    @ValueMapValue
    private String description;
    
    @ChildResource
    private Resource image;
    
    @PostConstruct
    protected void init() {
        // Initialization logic
    }
    
    public String getTitle() {
        return StringUtils.isNotBlank(title) ? title : "Default Title";
    }
    
    public String getDescription() {
        return description;
    }
    
    public boolean isShowImage() {
        return image != null;
    }
}
```

## Dialog Configuration

### Touch UI Dialog (_cq_dialog.xml)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:sling="http://sling.apache.org/jcr/sling/1.0" 
          xmlns:cq="http://www.day.com/jcr/cq/1.0" 
          xmlns:jcr="http://www.jcp.org/jcr/1.0" 
          xmlns:nt="http://www.jcp.org/jcr/nt/1.0"
    jcr:primaryType="nt:unstructured"
    jcr:title="My Component"
    sling:resourceType="cq/gui/components/authoring/dialog">
    <content
        jcr:primaryType="nt:unstructured"
        sling:resourceType="granite/ui/components/coral/foundation/container">
        <items jcr:primaryType="nt:unstructured">
            <tabs
                jcr:primaryType="nt:unstructured"
                sling:resourceType="granite/ui/components/coral/foundation/tabs"
                maximized="{Boolean}true">
                <items jcr:primaryType="nt:unstructured">
                    <general
                        jcr:primaryType="nt:unstructured"
                        jcr:title="General"
                        sling:resourceType="granite/ui/components/coral/foundation/fixedcolumns"
                        margin="{Boolean}true">
                        <items jcr:primaryType="nt:unstructured">
                            <column
                                jcr:primaryType="nt:unstructured"
                                sling:resourceType="granite/ui/components/coral/foundation/container">
                                <items jcr:primaryType="nt:unstructured">
                                    <title
                                        jcr:primaryType="nt:unstructured"
                                        sling:resourceType="granite/ui/components/coral/foundation/form/textfield"
                                        fieldLabel="Title"
                                        name="./title"/>
                                    <description
                                        jcr:primaryType="nt:unstructured"
                                        sling:resourceType="granite/ui/components/coral/foundation/form/textarea"
                                        fieldLabel="Description"
                                        name="./description"/>
                                </items>
                            </column>
                        </items>
                    </general>
                </items>
            </tabs>
        </items>
    </content>
</jcr:root>
```

## Client Libraries

### CSS Structure
```css
.my-component {
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 4px;
}

.my-component h2 {
    color: #333;
    font-size: 24px;
    margin-bottom: 10px;
}

.my-component p {
    color: #666;
    line-height: 1.5;
}

/* Responsive design */
@media (max-width: 768px) {
    .my-component {
        padding: 10px;
    }
    
    .my-component h2 {
        font-size: 20px;
    }
}
```

### JavaScript Structure
```javascript
(function($, document) {
    'use strict';
    
    var MyComponent = {
        init: function() {
            this.bindEvents();
        },
        
        bindEvents: function() {
            $('.my-component').on('click', '.my-button', this.handleClick);
        },
        
        handleClick: function(event) {
            event.preventDefault();
            // Handle click logic
        }
    };
    
    $(document).ready(function() {
        MyComponent.init();
    });
    
})(jQuery, document);
```

## Testing Strategies

### Unit Testing with JUnit
```java
@ExtendWith(AemContextExtension.class)
class MyComponentModelTest {
    
    private final AemContext context = new AemContext();
    
    @Test
    void testGetTitle() {
        // Setup
        context.load().json("/component-content.json", "/content/test");
        Resource resource = context.resourceResolver().getResource("/content/test/component");
        
        // Execute
        MyComponentModel model = resource.adaptTo(MyComponentModel.class);
        
        // Verify
        assertEquals("Expected Title", model.getTitle());
    }
    
    @Test
    void testGetTitleWithDefault() {
        // Setup - empty resource
        Resource resource = context.create().resource("/content/empty");
        
        // Execute
        MyComponentModel model = resource.adaptTo(MyComponentModel.class);
        
        // Verify
        assertEquals("Default Title", model.getTitle());
    }
}
```

### Integration Testing
```java
@Test
void testComponentRendering() {
    // Setup component content
    context.load().json("/test-content.json", "/content/test");
    context.currentResource("/content/test/component");
    
    // Render component
    String html = context.render();
    
    // Verify rendered output
    assertThat(html, containsString("Expected Title"));
    assertThat(html, containsString("my-component"));
}
```

### Frontend Testing with Jest
```javascript
describe('MyComponent', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div class="my-component">
                <button class="my-button">Click me</button>
            </div>
        `;
    });
    
    test('should handle button click', () => {
        const button = document.querySelector('.my-button');
        const clickHandler = jest.fn();
        
        button.addEventListener('click', clickHandler);
        button.click();
        
        expect(clickHandler).toHaveBeenCalled();
    });
});
```

## Performance Considerations

### Caching Strategies
- Use Dispatcher caching for static content
- Implement component-level caching where appropriate
- Use lazy loading for heavy components
- Optimize images and assets

### Code Optimization
- Minimize HTTP requests
- Use efficient selectors in CSS and JavaScript
- Implement proper error handling
- Follow AEM best practices for resource resolution

## Accessibility Guidelines

### WCAG Compliance
- Use semantic HTML elements
- Provide alternative text for images
- Ensure proper color contrast
- Implement keyboard navigation
- Use ARIA attributes where necessary

### Testing Accessibility
```html
<!-- Good example -->
<button aria-label="Close dialog" class="close-button">
    <span aria-hidden="true">&times;</span>
</button>

<!-- Bad example -->
<div onclick="closeDialog()" class="close-button">
    &times;
</div>
```

## Deployment and Maintenance

### Component Versioning
- Use semantic versioning for components
- Maintain backward compatibility
- Document breaking changes
- Provide migration guides

### Monitoring and Analytics
- Implement component usage tracking
- Monitor performance metrics
- Set up error logging
- Use A/B testing for component variations

This guide provides a comprehensive foundation for AEM component development and testing strategies.
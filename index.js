// Remove { Component }
const removeComponentImport = (root, j) => {
  return root
    .find(j.ImportSpecifier, {
      imported: {
        type: "Identifier",
        name: "Component"
      }
    })
    .remove();
};

// Parse propTypes into constructor, move to bottom
const buildPropTypeConstructor = (root, j, className) => {
  let propTypes = "({ ";
  let staticPropTypes = `${className}.propTypes = {\n`;
  let staticDefaultProps = `${className}.defaultProps = {\n`;
  let hasDefaultProps;
  let hasPropTypes;
  root.find(j.ClassProperty).forEach(path => {
    if (path.value.key.name === "propTypes") {
      hasPropTypes = true;
      const props = path.value.value.properties;
      for (let x = 0; x < props.length; x++) {
        propTypes = `${propTypes}${props[x].key.name}`;
        staticPropTypes = `${staticPropTypes}  ${props[x].key.name}: ${j(
          props[x].value
        ).toSource()}`;
        if (props.length - x > 1) {
          // avoid trailing comma
          propTypes = `${propTypes}, `;
          staticPropTypes = `${staticPropTypes},\n`;
        }
      }
      staticPropTypes = `${staticPropTypes}\n};`;
      propTypes = `${propTypes} })`;
    }
    if (path.value.key.name === "defaultProps") {
      hasDefaultProps = true;
      const defaultProps = path.value.value.properties;
      for (let y = 0; y < defaultProps.length; y++) {
        staticDefaultProps = `${staticDefaultProps}  ${
          defaultProps[y].key.name
        }: ${j(defaultProps[y].value).toSource()}`;
        if (defaultProps.length - y > 1) {
          staticDefaultProps = `${staticDefaultProps},\n`;
        }
      }
      staticDefaultProps = `${staticDefaultProps}\n};`;
    }
  });
  return {
    hasDefaultProps,
    hasPropTypes,
    staticDefaultProps,
    staticPropTypes,
    propTypes
  };
};

// Copied from jscodeshift examples
const replaceThisProps = (root, j) => {
  root
    .find(j.MemberExpression, {
      object: {
        type: "MemberExpression",
        object: { type: "ThisExpression" },
        property: { name: "props" }
      }
    })
    .filter(e => {
      const resolvedScope = e.scope.lookup(e.value.property.name);
      return resolvedScope == null;
    })
    .replaceWith(p => p.value.property);
};

const findClassName = root => {
  let className;
  root.get().node.program.body.forEach(node => {
    if (node.type === "ExportDefaultDeclaration") {
      className = node.declaration.id.name;
    }
  });
  return className;
};

export default function(fileinfo, api) {
  const j = api.jscodeshift;
  const source = fileinfo.source;
  const root = j(source);

  removeComponentImport(root, j);
  const className = findClassName(root);
  const {
    hasDefaultProps,
    hasPropTypes,
    staticDefaultProps,
    staticPropTypes,
    propTypes
  } = buildPropTypeConstructor(root, j, className);
  replaceThisProps(root, j);
  if (hasPropTypes) {
    root.get().node.program.body.push(staticPropTypes);
  }
  if (hasDefaultProps) {
    root.get().node.program.body.push(staticDefaultProps);
  }
  root.find(j.ClassProperty).remove();
  root.get().node.program.body.forEach(node => {
    if (node.type === "ExportDefaultDeclaration") {
      node.declaration = `function ${className}${propTypes} {\n${j(
        node.declaration.body.body[0].value.body.body[0]
      ).toSource()}
}`;
    }
  });
  return root.toSource();
}

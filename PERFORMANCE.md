# Attempts

## Component-only Archetypes

TODO.

# Improvement

## Batch Archetype Updates

When multiple components are added / removed from an entity,
it would be nice to batch those changes... Not easy to do if
we do not add deferred addition.

## Archetype Match

The ComponentManager could use different logic to save query archetype:
* if archetype count and component type are low, maybe query by using `match`
* otherwise, use archetype hashing
